/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events'

const emitter = new EventEmitter()
const amqplib: any = jest.genMockFromModule('amqplib')

function connect(): Promise<any> {
  return Promise.resolve({
    emitter,
    on: jest.fn().mockImplementation((action: string, callback: any) => {
      if (action === 'error') {
        emitter.addListener('connection-error', callback)
      } else {
        emitter.addListener(action, callback)
      }
    }),
    close: jest.fn().mockImplementation(() => {
      emitter.removeAllListeners()
    }),
    emit: jest.fn().mockImplementation((action: string) => emitter.emit(action)),
    createChannel: jest.fn().mockResolvedValue({
      on: jest.fn().mockImplementation((action: string, callback: any) => {
        if (action === 'error') {
          emitter.addListener('channel-error', callback)
        } else {
          emitter.addListener(action, callback)
        }
      }),
      emit: jest.fn().mockImplementation((action: string) => emitter.emit(action)),
      close: jest.fn(),
      prefetch: jest.fn(),
      assertExchange: jest.fn(),
      consume: jest.fn().mockImplementation((queue, callback) => {
        const amqpMessage = {
          content: {
            message: 'Why am I the only one who has that dream?',
            uid: '1234567890ABCDEF',
          },
          fields: { routingKey: 'boop-or-other.thing' },
        }
        callback(amqpMessage)
      }),
      ack: jest.fn(),
      publish: jest
        .fn()
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => {
          throw new Error()
        }),
      assertQueue: jest.fn().mockResolvedValue({
        queue: {},
      }),
      bindQueue: jest.fn(),
      sendToQueue: jest.fn(),
    }),
  })
}

amqplib.connect = jest.fn().mockImplementation(connect)

module.exports = amqplib
