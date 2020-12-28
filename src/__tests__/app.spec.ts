import { createRabbitMqClient } from '../app'
import { log } from '../logger'
import { AmqpClient } from '../AmqpClient'

beforeAll(() => {
  log.info = jest.fn()
  log.warn = jest.fn()
  log.error = jest.fn()
})

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

describe('establishRabbitMqConnection()', () => {
  it('establishes a connection with default config', async () => {
    const amqpClient = await createRabbitMqClient(
      { host: 'host', port: 5672, username: 'username', password: 'password' },
      {},
    )
    expect(amqpClient).toBeInstanceOf(AmqpClient)
  })
})
