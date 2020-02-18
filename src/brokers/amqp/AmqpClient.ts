import {Channel, ConsumeMessage, Options} from "amqplib";
import {IAmqpConnectionHooks} from ".";
import uuid from "uuid";
import {Container} from "../../di";
import {ILogger, LoggerKey} from "../../server/Logger";

export interface AmqpClientOptions {
  /**
   * RPC message receiving queue name
   */
  rpcQueue: string;
  /**
   * Recommended true, if a message is not handled by the rpc consumer, it will be requeued,
   * so you risk keeping the messages forever in the queue if timed out
   */
  unique: boolean;
  /**
   * Create new channel for this client or use the broker's channel, *recommended
   */
  newChannel: boolean;
  /**
   * Options when asserting the RPC queue
   */
  rpcQueueOptions?: Options.AssertQueue;
}

export class AmqpClient {

  public channel!: Channel;
  private uniqueId?: string;
  private rpcCallbacks: { [correlationid: string]: (err?: any, payload?: any) => any } = {};

  /**
   * Return full rpcQueue name
   */
  public get baseRpcQueue() {
    if (this.clientOptions.unique) {
      if (!this.uniqueId) {
        this.uniqueId = uuid();
      }
      /**
       * Default queue name + uuid4
       */
      return `${this.clientOptions.rpcQueue || 'rpc'}.${this.uniqueId}`;
    }
    /**
     * If not unique, return simple rpc
     */
    return this.clientOptions.rpcQueue || "rpc";
  }

  constructor(private existingHooks: IAmqpConnectionHooks, private clientOptions: Partial<AmqpClientOptions>) {
  }

  public async init() {
    if (this.clientOptions.newChannel) {
      this.channel = await this.existingHooks.getConnection().createChannel();
    } else {
      this.channel = this.existingHooks.getChannel();
    }
    const defaultQueueOptions: Options.AssertQueue = {durable: false, autoDelete: true};
    const queueOptions = {...defaultQueueOptions, ...this.clientOptions.rpcQueueOptions || {}};
    await this.channel.assertQueue(this.baseRpcQueue, queueOptions);
    await this.channel.consume(this.baseRpcQueue, (msg: ConsumeMessage | null) => {
      this.consumeRpcMessage(msg)
    });
    Container.get<ILogger>(LoggerKey).info("AMQP Client Started");
  }

  /**
   * Try parse value to json, if unsuccessful return the string
   * @param buffer
   */
  private parseBuffer(buffer: Buffer) {
    const str = buffer.toString();
    try {
      const json = JSON.parse(str);
      return json;
    } catch (err) {
      return str;
    }
  }

  /**
   * Handle if received a message on the default RPC queue
   * @param msg
   */
  private consumeRpcMessage(msg: ConsumeMessage | null) {
    if (!msg) {
      return;
    }
    if (msg.properties.correlationId) {
      const correlationId = msg.properties.correlationId;
      /**
       * Check if callback exists
       */
      if (this.rpcCallbacks[correlationId]) {
        try {
          /**
           * Check message headers for error
           */
          if (msg.properties.headers.error) {
            // Return error
            this.rpcCallbacks[correlationId](this.parseBuffer(msg.content));
          } else {
            /**
             * Return success
             */
            this.rpcCallbacks[correlationId](null, this.parseBuffer(msg.content));
          }
        } catch (err) {
          /**
           * Catch if any other exception is thrown during parsing
           */
          this.rpcCallbacks[correlationId](err);
        }
        /**
         * Acknowledge message if handled
         */
        this.channel.ack(msg);
        /**
         * Delete the callback after is handled
         */
        delete this.rpcCallbacks[correlationId];
      } else {
        /**
         * Acknowledge message if the callback to handle it is removed
         */
        if (this.clientOptions.unique) {
          this.channel.ack(msg);
        } else {
          /**
           * Requeue message if not handled and the queue is not unique
           */
          this.channel.nack(msg, false, true);
        }
      }
    } else {
      /**
       * Acknowledge message if it doesn't have correlation id
       */
      this.channel.ack(msg);
    }
  }

  /**
   * RPC requests, publishes message on the given queue and waits for a response on the default RPC queue
   * @param exchange
   * @param routingKey
   * @param payload
   * @param timeout
   * @param options
   */
  public async rpc(exchange: string, routingKey: string, payload: any, options?: Options.Publish): Promise<any> {
    const correlationId = uuid();
    return new Promise((resolve, reject) => {
      /**
       * Callback to register on rpc reply or timeout error
       * @param err
       * @param payload
       */
      this.rpcCallbacks[correlationId] = (err: any, payload: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      };
      // const timeout = options!.
      let timeout: number = 10 * 60 * 1000;
      if (options && options.expiration) {
        timeout = options.expiration as number;
      }
      /**
       * After called check if the callback still exists and reject it with the timeout message
       */
      setTimeout(() => {
        if (this.rpcCallbacks[correlationId]) {
          this.rpcCallbacks[correlationId](new Error("RPC TIMEOUT"));
          delete this.rpcCallbacks[correlationId];
        }
      }, timeout);
      /**
       * Send message and wait for reply
       */
      this.publish(exchange, routingKey, payload, {
        ...options || {},
        replyTo: this.baseRpcQueue,
        correlationId: correlationId
      });
    });
  }

  /**
   * Send message directly to the specified queue
   * @param queue
   * @param payload
   * @param options
   */
  public sendToQueue(queue: string, payload: any, options?: Options.Publish) {
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), options);
  }

  /**
   * Publish message to an exchange
   * @param exchange
   * @param payload
   * @param routingKey
   * @param options
   */
  public publish(exchange: string, routingKey: string = "", payload: any, options: Options.Publish | undefined = undefined) {
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), options);
  }

}
