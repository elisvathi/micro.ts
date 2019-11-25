import {expect} from 'chai';
import {Channel, Connection} from 'amqplib';
declare module "amqplib"{
  function connect(config: any): Connection;
  interface Connection {
    createChannel(): Promise<Channel>;
  }
  interface Channel {
    assertQueue(...args: any[]): Promise<void>;
    assertExchange(...args: any[]): Promise<void>;
  }
}

