import {Channel, Connection, Options} from "amqplib";

/**
 * Configuration for amqp connection
 */
export type IAmqpConfig = string | Options.Connect;
/**
 * Exchange configuration type, used as a key to <Exchange-Binding> map
 */
export type IAmqpExchangeConfig = { name: string, type: 'topic' | 'fanout' | 'direct', options?: Options.AssertExchange };
/**
 * Binding pair with the queue name and the binding pattern
 */
export type IAmqpBindingConfig = { queue: string, pattern: string };

/**
 * Interface to pass into the AmqpClient to get a connection, and an existing channel if needed
 */
export interface IAmqpConnectionHooks {
  /**
   * Return an existing connection
   */
  getConnection(): Connection;

  /**
   * Return an existing chanel
   */
  getChannel(): Channel;
}

export interface TopicBasedAmqpConfig {
  /**
   * Connections string or connection options
   */
  connection: IAmqpConfig;
  /**
   * Default topic exchange name
   */
  topic: string;
}
