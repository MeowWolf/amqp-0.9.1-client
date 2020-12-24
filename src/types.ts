import { ConsumeMessage } from 'amqplib'

export interface Config {
  host: string
  port: number
  exchangeName: string
  username: string
  password: string
  vhost?: string
  tls?: boolean
  prefetch?: number
  autoReconnect?: boolean
  retryConnectionInterval: number
}

export enum ExchangeType {
  Direct = 'direct',
  Fanout = 'fanout',
  Topic = 'topic',
  Headers = 'header',
}

export type RoutingKey = string

export interface ExchangeConfig {
  name?: string
  type?: ExchangeType
  routingKey?: RoutingKey
  durable?: boolean
  autoDelete?: boolean
}

export interface QueueConfig {
  name?: string
  routingKey?: RoutingKey
  exclusive?: boolean
  durable?: boolean
  autoDelete?: boolean
  noAck?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessagePayload = Record<string, any> | (Record<string, any> & Array<Record<string, any>>)

export type AssembledMessage = ConsumeMessage & {
  payload: MessagePayload
}

export type ConsumerCallback = (message: AssembledMessage) => unknown

export interface Consumer {
  config: QueueConfig
  callback: ConsumerCallback
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericObject = Record<string, any>
