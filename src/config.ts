import dotenv from 'dotenv'
dotenv.config()

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'

export const prettyPrintLogs = true
export const logLevel = LOG_LEVEL
export const defaultAutoReconnect = true
export const defaultRetryConnectionInterval = 5000
export const defaultPrefetch = 0
export const defaultTls = false
export const defaultVhost = '/'
export const defaultAppId = '@meowwolf/amqp-0.9.1-client'
