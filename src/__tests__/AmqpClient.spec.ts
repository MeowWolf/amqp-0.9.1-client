import { ConsumeMessage } from 'amqplib'
import { AmqpClient } from '../AmqpClient'
import { AmqpConfig, Consumer, ExchangeConfig, ExchangeType, QueueConfig } from '../types'
import { log } from '../logger'

const amqpConfigFixture: AmqpConfig = {
  host: '127.0.0.1',
  port: 5672,
  vhost: '/',
  autoReconnect: true,
  prefetch: 0,
  retryConnectionInterval: 5000,
  username: 'rabbitmq',
  password: 'rabbitmq',
}

const queueConfigFixture: QueueConfig = {
  queueName: '',
  routingKey: 'test-routing-key',
  exclusive: true,
  durable: false,
  autoDelete: true,
}

const exchangeConfigFixture: ExchangeConfig = {
  exchangeName: 'test-exchange',
  type: ExchangeType.Direct,
  durable: true,
  autoDelete: false,
}

beforeAll(() => {
  log.info = jest.fn()
  log.warn = jest.fn()
  log.error = jest.fn()
})

let amqp: AmqpClient
beforeEach(() => {
  jest.useFakeTimers()
  amqp = new AmqpClient(amqpConfigFixture)
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  amqp.close()
})

describe('AmqpClient', () => {
  describe('init()', () => {
    it('initializes', async () => {
      const initializedAmqp = await amqp.init()
      expect(initializedAmqp).toBeTruthy()
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('XXXXXX:XXXXXX'))
    })

    it('initializes with alternate config', async () => {
      const amqp = new AmqpClient({ ...amqpConfigFixture, vhost: '', tls: true, prefetch: undefined })
      const initializedAmqp = await amqp.init()
      expect(initializedAmqp).toBeTruthy()
    })

    it('closes without having connected', async () => {
      await amqp.close()
    })

    it('initializes with a consumer', async () => {
      const callback = jest.fn()
      const consumer: Consumer = {
        config: queueConfigFixture,
        callback,
      }
      const addConsumer = jest.spyOn(amqp, 'addConsumer')

      const initializedAmqp = await amqp.init(exchangeConfigFixture, [consumer])
      expect(initializedAmqp).toBeTruthy()
      expect(addConsumer).toHaveBeenNthCalledWith<[Consumer]>(1, consumer)
      initializedAmqp.close()
    })

    it('initializes with duplicate consumers', async () => {
      const callback = jest.fn()
      const consumer: Consumer = {
        config: queueConfigFixture,
        callback,
      }
      const addConsumer = jest.spyOn(amqp, 'addConsumer')

      const initializedAmqp = await amqp.init(exchangeConfigFixture, [consumer, consumer])
      expect(initializedAmqp).toBeTruthy()
      expect(addConsumer).toHaveBeenNthCalledWith<[Consumer]>(1, consumer)
      initializedAmqp.close()
    })

    it('auto reconnects', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.connection.emit('close')
      jest.advanceTimersByTime(5000)
      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)
    })

    it('does not auto reconnect', async () => {
      const amqp = new AmqpClient({ ...amqpConfigFixture, autoReconnect: false })
      const initializedAmqp = await amqp.init()
      initializedAmqp.connection.emit('close')
      jest.advanceTimersByTime(5000)
      expect(setTimeout).not.toHaveBeenCalled()
    })
  })

  describe('publish()', () => {
    it('publishes a message', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.publish('I drank what?')
      expect(initializedAmqp.channel.publish).toHaveBeenCalledTimes(1)

      // warns when there's an error
      initializedAmqp.publish('I drank what?')
      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining('Exception while publishing message:'),
        expect.anything(),
      )
    })

    it('publishes a message to more than one routing key', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.publish('I drank what?', { routingKey: ['first.one', 'second.one'] })
      expect(initializedAmqp.channel.publish).toHaveBeenCalledTimes(2)
    })
  })

  describe('sendToQueue()', () => {
    it('sends a message to a queue', async () => {
      const payload = "It's coherent light."
      const queueName = 'So it talks, right?'

      const initializedAmqp = await amqp.init()
      initializedAmqp.sendToQueue(payload, { queueName })
      expect(initializedAmqp.channel.sendToQueue).toHaveBeenCalledWith(queueName, expect.anything(), expect.anything())
    })
  })

  describe('ack()', () => {
    it('acks', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.ack({
        ...(({} as unknown) as ConsumeMessage),
        payload: { a: 'payload' },
      })
    })
  })

  describe('error handling', () => {
    it('catches an exception', async () => {
      const callback = jest.fn()
      const consumer: Consumer = {
        config: queueConfigFixture,
        callback,
      }
      jest.spyOn(amqp, 'addConsumer').mockImplementation(() => {
        throw new Error()
      })

      try {
        await amqp.init(exchangeConfigFixture, [consumer])
      } catch (e) {
        expect(e).toBeInstanceOf(Error)
      }
    })

    it('receives and catches a connection level error event', async () => {
      const initializedAmqp = await amqp.init()
      try {
        // 'channel-error' isn't a 'real' error event name
        // It's necessary in tests though so the right listener can respond
        // The mock sees it and sends it to the right listener
        initializedAmqp.connection.emit('channel-error')
      } catch (e) {
        expect(e).toBeTruthy()
      }
    })

    it('receives and catches a channel level error event', async () => {
      const initializedAmqp = await amqp.init()
      try {
        // 'connection-error' isn't a 'real' error event name
        // It's necessary in tests though so the right listener can respond
        // The mock sees it and sends it to the right listener
        initializedAmqp.channel.emit('connection-error')
      } catch (e) {
        expect(e).toBeTruthy()
      }
    })

    it('tries to auto reconnect but cannot', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.init = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      try {
        initializedAmqp.connection.emit('close')
        jest.advanceTimersByTime(5000)
        expect(setTimeout).toHaveBeenCalledTimes(1)
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)
      } catch (e) {
        expect(e).toBeInstanceOf(Error)
      }
    })
  })
})
