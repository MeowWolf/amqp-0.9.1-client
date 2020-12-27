import { connect, Connection, Channel, Replies, ConsumeMessage } from 'amqplib'
import {
  defaultAppId,
  defaultVhost,
  defaultTls,
  defaultPrefetch,
  defaultAutoReconnect,
  defaultRetryConnectionInterval,
} from './config'
import { log } from './logger'
import {
  AssembledMessage,
  AmqpConfig,
  Consumer,
  ConsumerCallback,
  ExchangeConfig,
  ExchangeType,
  QueueConfig,
  RoutingKey,
  PublishOptions,
  SendToQueueOptions,
} from './types'
export * from './types'

const defaultExchangeConfig: ExchangeConfig = {
  exchangeName: 'amq.direct',
  type: ExchangeType.Direct,
  routingKey: '',
  durable: false,
  autoDelete: true,
}

const defaultQueueConfig: QueueConfig = {
  queueName: '',
  exclusive: true,
  durable: false,
  autoDelete: true,
  noAck: true,
}

export class AmqpClient {
  public connection: Connection
  public channel: Channel
  private exchangeConfig: ExchangeConfig
  private consumers: Consumer[] = []

  constructor(private config: AmqpConfig) {}

  public async init(exchangeConfig: ExchangeConfig = {}, consumers: Consumer[] = []): Promise<AmqpClient> {
    this.exchangeConfig = {
      ...defaultExchangeConfig,
      ...exchangeConfig,
    }

    try {
      await this.connect()
      await this.createChannel()
      await this.assertExchange()

      // initialize consumers
      const consumersArray = consumers.length ? consumers : this.consumers

      // Not sure why but *sometimes* on reconnect the old consumers aren't cleared
      const reducedConsumers = AmqpClient.removeDuplicateConsumers(consumersArray)

      await Promise.all(reducedConsumers.map(async consumer => await this.addConsumer(consumer)))
    } catch (e) {
      this.close()
      await this.reconnect()
      throw new Error(`Could not initialize amqp connection: ${e}`)
    }

    return this
  }

  private async connect(): Promise<void> {
    const brokerUrl = AmqpClient.getBrokerUrl(this.config)
    this.connection = await connect(brokerUrl)
    log.info(`AMQP Successfully connected to ${brokerUrl} `)

    this.connection.on('error', (e): void => {
      log.error(e)
    })

    this.connection.on('close', this.reconnect.bind(this))
  }

  private async reconnect(): Promise<void> {
    log.warn('AMQP connection closed!')
    const { autoReconnect, retryConnectionInterval } = this.config
    const doAutoReconnect =
      autoReconnect !== undefined ? autoReconnect : /* istanbul ignore next */ defaultAutoReconnect

    if (doAutoReconnect) {
      log.info('Attempting to reconnect...')
      setTimeout(async () => {
        try {
          await this.init(this.exchangeConfig)
          log.warn('Reconnection successful!')
        } catch (e) {
          log.info('Unable to reconnect: ', e)
        }
      }, retryConnectionInterval || /* istanbul ignore next */ defaultRetryConnectionInterval)
    }
  }

  private async createChannel(): Promise<void> {
    const { prefetch } = this.config
    const prefetchCount = prefetch !== undefined ? prefetch : defaultPrefetch
    this.channel = await this.connection.createChannel()
    this.channel.prefetch(Number(prefetchCount))

    this.channel.on('error', (e): void => {
      throw new Error(`AMQP Channel Error: ${e}`)
    })
  }

  private async assertExchange(): Promise<void> {
    const { exchangeName, type, durable, autoDelete } = this.exchangeConfig

    await this.channel.assertExchange(exchangeName, type, {
      durable: durable,
      autoDelete: autoDelete,
    })
  }

  public async addConsumer(consumer: Consumer): Promise<void> {
    this.consumers.push(consumer)
    const { config, callback } = consumer
    await this.consume(config, callback)
  }

  private async consume(queueConfig: QueueConfig, callback: ConsumerCallback): Promise<AmqpClient> {
    const config = {
      routingKey: this.exchangeConfig.routingKey,
      ...defaultQueueConfig,
      ...queueConfig,
    }

    const q = await this.assertQueue(config)
    this.bindQueue(q, config.routingKey)
    const { noAck } = config
    await this.channel.consume(
      q.queue,
      amqpMessage => {
        const message = AmqpClient.assembleMessage(amqpMessage)
        callback(message)
      },
      { noAck },
    )

    return this
  }

  public ack(message: AssembledMessage): void {
    this.channel.ack(message)
  }

  public publish(payload: string, options?: PublishOptions): AmqpClient {
    const { appId: configAppId } = this.config
    const appId = configAppId || defaultAppId

    const config = {
      ...this.exchangeConfig,
      ...options,
    }
    const { exchangeName, routingKey, correlationId, headers } = config
    try {
      this.channel.publish(exchangeName, routingKey, Buffer.from(payload), { appId, correlationId, headers })
    } catch (e) {
      log.warn('Exception while publishing message:', e.message)
    }

    return this
  }

  public sendToQueue(payload: string, options: SendToQueueOptions): AmqpClient {
    const { appId: configAppId } = this.config
    const appId = configAppId || defaultAppId

    const { queueName, correlationId, headers } = options
    this.channel.sendToQueue(queueName, Buffer.from(payload), { appId, correlationId, headers })

    return this
  }

  private async assertQueue(queueConfig: QueueConfig): Promise<Replies.AssertQueue | null> {
    const { queueName, exclusive, durable, autoDelete } = queueConfig
    let queue: Replies.AssertQueue | null = null

    queue = await this.channel.assertQueue(queueName, {
      exclusive,
      durable,
      autoDelete,
    })

    return queue
  }

  private bindQueue(q: Replies.AssertQueue, routingKey: RoutingKey): void {
    const { exchangeName } = this.exchangeConfig
    this.channel.bindQueue(q.queue, exchangeName, routingKey)
  }

  public async close(): Promise<void> {
    try {
      await this.channel.close()
    } catch (e) {
      /* istanbul ignore next */
      log.warn('Exception while closing channel:', e.message)
    }
    try {
      await this.connection.close()
    } catch (e) {
      /* istanbul ignore next */
      log.warn('Exception while closing connection:', e.message)
    }
  }

  private static removeDuplicateConsumers(consumers: Consumer[]): Consumer[] {
    const reducedConsumers = consumers.reduce((accumulator, item) => {
      const exists = accumulator.find(i => i.config.routingKey === item.config.routingKey)
      if (!exists) {
        accumulator.push(item)
      }
      return accumulator
    }, [])
    return reducedConsumers
  }

  private static getBrokerUrl(config: AmqpConfig): string {
    const { host, port, vhost, tls, username, password } = config

    const yesTls = tls !== undefined ? tls : defaultTls
    const protocol = yesTls ? 'amqps' : 'amqp'
    const vhostName = vhost || defaultVhost

    const url = `${protocol}://${username}:${password}@${host}:${port}${vhostName}`
    return url
  }

  private static assembleMessage(amqpMessage: ConsumeMessage): AssembledMessage {
    let payload
    try {
      payload = JSON.parse(amqpMessage.content.toString())
    } catch {
      payload = amqpMessage.content.toString()
    }
    return {
      ...amqpMessage,
      payload,
    }
  }
}

export const establishRabbitMqConnection = async (
  amqpConfig?: AmqpConfig,
  exchangeConfig?: ExchangeConfig,
): Promise<AmqpClient> => {
  const amqpClient = new AmqpClient(amqpConfig)

  try {
    await amqpClient.init(exchangeConfig || defaultExchangeConfig)
  } catch (e) {
    /* istanbul ignore next */
    log.error(e)
  }
  return amqpClient
}
