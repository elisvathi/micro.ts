import { AbstractBroker, DefinitionHandlerPair } from "../AbstractBroker";
import { Channel, connect, Connection, ConsumeMessage, Message, Options } from 'amqplib';
import { RequestMapper, RouteMapper } from "../IBroker";
import { Action, BaseRouteDefinition, QueueOptions } from "../../server/types";
import { AmqpClient, AmqpClientOptions } from "./AmqpClient";

export type IAmqpConfig = string | Options.Connect;

export class AmqpBroker<T = IAmqpConfig> extends AbstractBroker<T> {
  protected connection!: Connection;
  protected channel!: Channel;
  protected requestMapper: RequestMapper = (r: Message, queue: string, json: boolean) => {
    const payloadString = r.content.toString();
    let payload: any;
    if (json) {
      try {
        payload = JSON.parse(payloadString);
      } catch (err) {
        this.channel.ack(r);
        throw (err);
      }
    }
    else {
      payload = payloadString;
    }
    const act: Action = {
      request: {
        params: {},
        path: queue,
        headers: r.properties.headers,
        // method: def.method,
        body: payload,
        qs: {},
        raw: r
      },
      connection: this.connection
    };
    return act;
  };

  /**
   * Default route mapping
   */
  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    return `${def.base}.${def.controller}.${def.handler}`.replace(/\//g, '.');
  };

  /**
   * Creates an AMQP client which provides sendToQueue, publish, and rpc methods, to work with the AMQP server
   * @param opts
   */
  public async createClient(opts?: Partial<AmqpClientOptions>): Promise<AmqpClient> {
    const defaultOptions: AmqpClientOptions = {
      rpcQueue: "rpc",
      unique: true,
      newChannel: true,
    };
    const options = { ...defaultOptions, ...opts || {}};
    const client = new AmqpClient(this, options);
    await client.init();
    return client;
  }

  /**
   * Return AMQP connection, available after the server is started
   */
  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Returns the broker channel used to consume the app queues
   */
  public getChannel(): Channel {
    return this.channel;
  }

  protected async consumeMessage(route: string,
    message: ConsumeMessage | null,
    value: DefinitionHandlerPair[],
    json: boolean) {
    if (message) {
      const mapped: Action = this.requestMapper(message, route, json);
      const handler = this.actionToRouteMapper(route, mapped, value);
      const result = await handler(mapped);
      if (result && message.properties.replyTo && message.properties.correlationId) {
        await this.rpcReply(result, message.properties.replyTo, message.properties.correlationId);
      }
      this.channel.ack(message);
    }
  }

  /**
   * Registered a single route definition and consumes messages from it
   * Called when the server is started
   * @param value
   * @param route
   */
  protected async registerSingleRoute(value: DefinitionHandlerPair[], route: string): Promise<boolean> {
    let json = false;
    let totalConsumers = 0;
    let queueOptions: QueueOptions = {};
    /*
     * Finds the number of consumers and the assertQueue options
     */
    value.forEach(v => {
      if (Object.keys(queueOptions).length == 0 && v.def.queueOptions) {
        queueOptions = { ...v.def.queueOptions };
        delete queueOptions.consumers;
      }
      const consumers = v.def.queueOptions ? v.def.queueOptions.consumers || 1 : 1;
      if (v.def.json) {
        json = true;
      }
      totalConsumers += consumers;
    });
    if (totalConsumers > 0) {
      await this.channel.assertQueue(route, queueOptions);
      /**
       * Create the specified number of consumers
       */
      for (let i = 0; i < totalConsumers; i++) {
        await this.channel.consume(route, async (message: ConsumeMessage | null) => {
          await this.consumeMessage(route, message, value, json);
        });
      }
      return true;
    } else {
      return false;
    }
  }

  protected async registerRoutes() {
    this.registeredRoutes.forEach(async (value: DefinitionHandlerPair[], route: string): Promise<void> => {
      await this.registerSingleRoute(value, route);
    });
  }

  /**
   * Reply if the message has replyTo queue  and correlationId
   * @param data
   * @param replyToQueue
   * @param correlationId
   */
  protected async rpcReply(data: Action, replyToQueue: string, correlationId: string) {
    const response = data.response || {};
    const body = response.body || response.error;
    const headers = response.headers || {};
    if (response.is_error) {
      headers.error = true;
    }
    headers.statusCode = response.statusCode;
    this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(body)), { correlationId, headers });
  }
  protected get connectionConfig(): IAmqpConfig {
    return this.config;
  }
  public async start(): Promise<void> {
    this.connection = await connect(this.connectionConfig);
    this.channel = await this.connection.createChannel();
    await this.registerRoutes();
    console.log(`AMQP Connected on ${this.config}`);
  }

  protected construct(): void {
    // Do nothing
  }

}
