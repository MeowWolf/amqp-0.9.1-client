import { ConsumeMessage } from 'amqplib'
import { config } from '../config'
import { AmqpClient } from '../app'
import { Consumer, ExchangeConfig, ExchangeType, QueueConfig } from '../types'
import { log } from '../logger'

const queueConfigFixture: QueueConfig = {
  name: '',
  exclusive: true,
  durable: false,
  autoDelete: true,
}

const exchangeConfigFixture: ExchangeConfig = {
  name: 'test-exchange',
  type: ExchangeType.Direct,
  routingKey: 'test-routing-key',
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
  amqp = new AmqpClient(config.amqp)
})

afterEach(() => {
  jest.restoreAllMocks()
  amqp.close()
})

describe('AmqpClient', () => {
  describe('init()', () => {
    it('initializes', async () => {
      const initializedAmqp = await amqp.init()
      expect(initializedAmqp).toBeTruthy()
    })

    it('initializes with alternate config', async () => {
      const amqp = new AmqpClient({ ...config.amqp, vhost: 'vhost-name', tls: true, autoReconnect: false })
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

    it('auto reconnects', async () => {
      const initializedAmqp = await amqp.init()
      initializedAmqp.connection.emit('close')
      jest.advanceTimersByTime(5000)
      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)
    })

    it('does not auto reconnect', async () => {
      const amqp = new AmqpClient({ ...config.amqp, autoReconnect: false })
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
