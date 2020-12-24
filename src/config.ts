import dotenv from 'dotenv'
dotenv.config()

const APP_NAME = 'amqp-0.9.1-client'
const PRETTY_LOGS = !!process.env.PRETTY_LOGS || true
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'
const RETRY_CONNECTION_INTERVAL = Number(process.env.RETRY_CONNECTION_INTERVAL) || 5000
const NODE_ENV = process.env.NODE_ENV || /* istanbul ignore next */ 'development'
const NODE_HOST = process.env.NODE_HOST || '127.0.0.1'
const AMQP_HOST = process.env.AMQP_HOST || 'rabbit'
const AMQP_VHOST = process.env.AMQP_VHOST || '/'
const AMQP_PORT = process.env.AMQP_PORT || '5672'
const AMQP_AUTORECONNECT = process.env.AMQP_AUTORECONNECT || true
const AMQP_USERNAME = process.env.AMQP_USERNAME || 'rabbitmq'
const AMQP_PASSWORD = process.env.AMQP_PASSWORD || 'rabbitmq'
const AMQP_EXCHANGE_NAME = process.env.AMQP_EXCHANGE_NAME || 'amq.topic'
const AMQP_PREFETCH_COUNT = process.env.AMQP_PREFETCH_COUNT || 0

export const config = {
  appId: `${APP_NAME}-${NODE_ENV}`,
  prettyPrintLogs: PRETTY_LOGS,
  logLevel: LOG_LEVEL,
  address: NODE_HOST,
  amqp: {
    host: AMQP_HOST,
    port: Number(AMQP_PORT),
    vhost: AMQP_VHOST,
    exchangeName: AMQP_EXCHANGE_NAME,
    autoReconnect: !!AMQP_AUTORECONNECT && AMQP_AUTORECONNECT !== 'false',
    prefetchCount: AMQP_PREFETCH_COUNT,
    retryConnectionInterval: Number(RETRY_CONNECTION_INTERVAL),
    username: AMQP_USERNAME,
    password: AMQP_PASSWORD,
  },
}
