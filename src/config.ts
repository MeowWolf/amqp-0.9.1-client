import dotenv from 'dotenv'
dotenv.config()

const PRETTY_LOGS = !!process.env.PRETTY_LOGS || true
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'

export const config = {
  prettyPrintLogs: PRETTY_LOGS,
  logLevel: LOG_LEVEL,
}
