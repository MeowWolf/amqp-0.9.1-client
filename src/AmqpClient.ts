import { connect, Connection, Channel, Replies, ConsumeMessage } from 'amqplib'
import { log } from './logger'
import { defaultExchangeConfig, defaultAmqpConfig, defaultQueueConfig, defaultPublishOptions } from './config'
import {
  AssembledMessage,
  AmqpConfig,
  Consumer,
  ConsumerCallback,
  ExchangeConfig,
  QueueConfig,
  RoutingKey,
  PublishOptions,
  SendToQueueOptions,
} from './types'
export * from './types'

export class AmqpClient {
  private amqpConfig: AmqpConfig
  private exchangeConfig: ExchangeConfig
  private consumers: Consumer[] = []
  public connection: Connection
  public channel: Channel

  constructor(config: AmqpConfig) {
    this.amqpConfig = {
      ...defaultAmqpConfig,
      ...config,
    }
  }

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
    const brokerUrl = AmqpClient.getBrokerUrl(this.amqpConfig)
    this.connection = await connect(brokerUrl)
    log.info(`AMQP Successfully connected to ${brokerUrl} `)

    this.connection.on('error', (e): void => {
      log.error(e)
    })

    this.connection.on('close', this.reconnect.bind(this))
  }

  private async reconnect(): Promise<void> {
    log.warn('AMQP connection closed!')
    const { autoReconnect, retryConnectionInterval } = this.amqpConfig

    if (autoReconnect) {
      log.info('Attempting to reconnect...')
      setTimeout(async () => {
        try {
          await this.init(this.exchangeConfig)
          log.warn('Reconnection successful!')
        } catch (e) {
          log.info('Unable to reconnect: ', e)
        }
      }, retryConnectionInterval)
    }
  }

  private async createChannel(): Promise<void> {
    const { prefetch } = this.amqpConfig
    this.channel = await this.connection.createChannel()
    this.channel.prefetch(Number(prefetch))

    this.channel.on('error', (e): void => {
      throw new Error(`AMQP Channel Error: ${e}`)
    })
  }

  private async assertExchange(): Promise<void> {
    const { exchangeName, type, durable, autoDelete } = this.exchangeConfig

    await this.channel.assertExchange(exchangeName, type, {
      durable,
      autoDelete,
    })
  }

  public async addConsumer(consumer: Consumer): Promise<void> {
    this.consumers.push(consumer)
    const { config, callback } = consumer
    await this.consume(config, callback)
  }

  private async consume(queueConfig: QueueConfig, callback: ConsumerCallback): Promise<AmqpClient> {
    const config = {
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
    const { appId } = this.amqpConfig

    const config = {
      ...this.exchangeConfig,
      ...defaultPublishOptions,
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
    const { appId } = this.amqpConfig

    const config = {
      ...defaultPublishOptions,
      ...options,
    }

    const { queueName, correlationId, headers } = config
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

    const protocol = tls ? 'amqps' : 'amqp'
    const url = `${protocol}://${username}:${password}@${host}:${port}${vhost}`

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
