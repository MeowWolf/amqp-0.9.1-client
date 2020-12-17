import bunyan, { LogLevel } from 'bunyan'
import PrettyStream from 'bunyan-prettystream'
import { config } from './config'
const { prettyPrintLogs, logLevel } = config

const prettyStdOut = new PrettyStream()
prettyStdOut.pipe(process.stdout)

export const log = bunyan.createLogger({
  name: 'mockingjay',
  serializers: bunyan.stdSerializers,
  stream: prettyPrintLogs ? prettyStdOut : /* istanbul ignore next */ process.stdout,
  level: (logLevel as LogLevel) || /* istanbul ignore next */ 'info',
})
