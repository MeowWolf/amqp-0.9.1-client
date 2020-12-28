import { log } from './logger'
import { AmqpClient } from './AmqpClient'
import { AmqpConfig, ExchangeConfig } from './types'

export * from './types'

export const createRabbitMqClient = async (
  amqpConfig: AmqpConfig,
  exchangeConfig: ExchangeConfig,
): Promise<AmqpClient> => {
  const amqpClient = new AmqpClient(amqpConfig)

  try {
    await amqpClient.init(exchangeConfig)
  } catch (e) {
    /* istanbul ignore next */
    log.error(e)
  }
  return amqpClient
}
