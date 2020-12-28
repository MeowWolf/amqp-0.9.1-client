# @meowwolf/amqp-0.9.1-client

A simple amqp client that facilitates publishing and subscribing to an amqp v0.9.1 RabbitMQ broker.

## Installation

```shell
$ npm i @meowwolf/amqp-0.9.1-client
```

## Usage

### Import the module:

```javascript
import { establishRabbitMqConnection } from '@meowwolf/amqp-0.9.1-client'
// or
const { establishRabbitMqConnection } = require('@meowwolf/amqp-0.9.1-client')
```

### Create an amqpClient:

```javascript
const amqpClient = await establishRabbitMqConnection(amqpConfig, exchangeConfig)

/*
AmqpConfig {
  host: string
  port: number
  username: string
  password: string
  appId?: string - default: '@meowwolf/amqp-0.9.1-client'
  vhost?: string - default: '/'
  tls?: boolean - default: false
  prefetch?: number - default: 0
  autoReconnect?: boolean - default: true
  retryConnectionInterval?: number in ms - default: 5000
}

ExchangeConfig {
  exchangeName?: string - default: 'amq.direct'
  type?: 'direct' | 'fanout' | 'topic' | 'header' - default: 'direct'
  durable?: boolean - default: false
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
  queueName?: string - default: ''
  routingKey?: string - default: ''
  exclusive?: boolean - default: true
  durable?: boolean - default: false
  autoDelete?: boolean - default: true
  noAck?: boolean - default: true
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
  exchangeName?: string - defaults to exchangeConfig value
  routingKey?: RoutingKey - defaults to exchangeConfig value
  correlationId?: string - default: ''
  headers?: GenericObject - default: {}
}
*/
```

### Publish a message directly to a queue

```javascript
amqpClient.sendToQueue(payloadString, sendToQueueOptions)

/*
SendToQueueOptions {
  queueName: string
  correlationId?: string - default: ''
  headers?: GenericObject - default: {}
}
*/
```
