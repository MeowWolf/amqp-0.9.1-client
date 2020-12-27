# @meowwolf/amqp-0.9.1-client

A simple amqp client that facilitates publishing and subscribing to an amqp v0.9.1 RabbitMQ broker.

## Installation

```shell
$ npm i @meowwolf/amqp-0.9.1-client
```

## Usage

### Create an amqpClient:

```javascript
import { establishRabbitMqConnection } from '@meowwolf/amqp-0.9.1-client'

const amqpClient = establishRabbitMqConnection(amqpConfig, exchangeConfig)

/*
AmqpConfig {
  host: string
  port: number
  exchangeName: string
  username: string
  password: string
  appId?: string
  vhost?: string
  tls?: boolean
  prefetch?: number
  autoReconnect?: boolean
  retryConnectionInterval?: number
}

ExchangeConfig {
  exchangeName?: string
  type?: 'direct' | 'fanout' | 'topic' | 'header'
  routingKey?: string
  durable?: boolean
  autoDelete?: boolean
}
*/
```

### Consume amqp messages

addConsumer() expects an argument object consisting of a configuration object and a callback

```javascript
await amqpClient.addConsumer({
  queueConfig,
  callback: message => {
    // .. do somethig with the message here
  },
})

/*
QueueConfig {
  queueName?: string
  routingKey?: string
  exclusive?: boolean
  durable?: boolean
  autoDelete?: boolean
  noAck?: boolean
}
*/
```

### Acknowledge amqp message

```javascript
amqpclient.ack(message)
```

### Publish a message

```javascript
amqpClient.publish(payloadString, publishOptions)

/*
PublishOptions {
  exchangeName?: string
  routingKey?: RoutingKey
  correlationId?: string
  headers?: GenericObject
}
*/
```

### Publish a message directly to a queue

```javascript
amqpClient.sendToQueue(payloadString, sendToQueueOptions)

/*
SendToQueueOptions {
  queueName: string
  correlationId?: string
  headers?: GenericObject
}
*/
```
