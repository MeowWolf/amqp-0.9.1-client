import { ConsumeMessage } from 'amqplib'

export interface AmqpConfig {
  host: string
  port: number
  username: string
  password: string
  appId?: string
  vhost?: string
  tls?: boolean
  prefetch?: number
  autoReconnect?: boolean
  retryConnectionInterval?: number
}

export interface ExchangeConfig {
  exchangeName?: string
  type?: ExchangeType
  durable?: boolean
  autoDelete?: boolean
}

export interface QueueConfig {
  queueName?: string
  routingKey?: RoutingKey
  exclusive?: boolean
  durable?: boolean
  autoDelete?: boolean
  noAck?: boolean
}

export interface PublishOptions {
  exchangeName?: string
  routingKey?: RoutingKey
  correlationId?: string
  headers?: GenericObject
}

export interface SendToQueueOptions {
  queueName: string
  correlationId?: string
  headers?: GenericObject
}

export enum ExchangeType {
  Direct = 'direct',
  Fanout = 'fanout',
  Topic = 'topic',
  Headers = 'header',
}

export type RoutingKey = string

export type MessagePayload = GenericObject | (GenericObject & Array<GenericObject>)

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
