import { Channel, Options, ConsumeMessage } from "amqplib";
import { AmqpBroker } from ".";
import uuid from "uuid";

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

  private channel!: Channel;
  private uniqueId?: string;
  private rpcCallbacks: { [correlationid: string]: (err?: any, payload?: any) => any } = {};

  public get baseRpcQueue() {
    if (this.clientOptions.unique) {
      if (!this.uniqueId) {
        this.uniqueId = uuid();
      }
      return `${this.clientOptions.rpcQueue}.${this.uniqueId}`;
    }
    return this.clientOptions.rpcQueue;
  }

  constructor(private broker: AmqpBroker, private clientOptions: AmqpClientOptions) {
  }

  public async init() {
    if (this.clientOptions.newChannel) {
      this.channel = await this.broker.getConnection().createChannel();
    } else {
      this.channel = this.broker.getChannel();
    }
    const defaultQueueOptions: Options.AssertQueue = { durable: false, autoDelete: true };
    const queueOptions = { ...defaultQueueOptions, ...this.clientOptions.rpcQueueOptions || {} };
    await this.channel.assertQueue(this.baseRpcQueue, queueOptions);
    await this.channel.consume(this.baseRpcQueue, (msg: ConsumeMessage | null) => {
      this.consumeRpcMessage(msg)
    });
    console.log("AMQP Client Started");
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
      // Check if callback exists
      if (this.rpcCallbacks[correlationId]) {
        try {
          /**
           * Check message headers for error
           */
          if (msg.properties.headers.error) {
            // Return error
            this.rpcCallbacks[correlationId](this.parseBuffer(msg.content));
          } else {
            // Return success
            this.rpcCallbacks[correlationId](null, this.parseBuffer(msg.content));
          }
        } catch (err) {
          // Catch if any other exception is thrown during parsing
          this.rpcCallbacks[correlationId](err);
        }
        // Acknowledge message if handled
        this.channel.ack(msg);
        // Delete the callback after is handled
        delete this.rpcCallbacks[correlationId];
      } else {
        // Acknowledge message if the callback to handle it is removed
        if (this.clientOptions.unique) {
          this.channel.ack(msg);
        } else {
          // Requeue message if not handled and the queue is not unique
          this.channel.nack(msg, false, true);
        }
      }
    } else {
      // Acknowledge message if it doesn't have correlation id
      this.channel.ack(msg);
    }
  }

  /**
   * RPC requests, publishes message on the given queue and waits for a response on the default RPC queue
   * @param queue
   * @param payload
   * @param timeout
   */
  public async rpc(queue: string, payload: any, timeout: number = 20 * 60 * 1000): Promise<any> {
    const correlationId = uuid();
    return new Promise((resolve, reject) => {
      // Callback to register on rpc reply or timeout error
      const callback = (err: any, payload: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      };
      this.rpcCallbacks[correlationId] = callback;
      // After called check if the callback still exists and reject it with the timeout message
      setTimeout(() => {
        if (this.rpcCallbacks[correlationId]) {
          this.rpcCallbacks[correlationId](new Error("RPC TIMEOUT"));
          delete this.rpcCallbacks[correlationId];
        }
      }, timeout);
      // Send message and wait for reply
      this.sendToQueue(queue, payload, { replyTo: this.baseRpcQueue, correlationId: correlationId });
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
   */
  public publish(exchange: string, payload: any, routingKey: string = "") {
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)));
  }

}
