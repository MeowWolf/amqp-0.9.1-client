import dotenv from 'dotenv'
import { ExchangeConfig, ExchangeType, QueueConfig } from './types'
dotenv.config()

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'
const PRETTY_PRINT_LOGS = process.env.PRETTY_PRINT_LOGS || true

export const logLevel = LOG_LEVEL
export const prettyPrintLogs = PRETTY_PRINT_LOGS

export const defaultAmqpConfig = {
  appId: '@meowwolf/amqp-0.9.1-client',
  vhost: '/',
  tls: false,
  prefetch: 0,
  autoReconnect: true,
  retryConnectionInterval: 5000,
}

export const defaultExchangeConfig: ExchangeConfig = {
  exchangeName: 'amq.direct',
  type: ExchangeType.Direct,
  durable: true,
  autoDelete: false,
}

export const defaultQueueConfig: QueueConfig = {
  queueName: '',
  routingKey: '',
  exclusive: true,
  durable: false,
  autoDelete: true,
  noAck: true,
}

export const defaultPublishOptions = {
  correlationId: '',
  headers: {},
}
