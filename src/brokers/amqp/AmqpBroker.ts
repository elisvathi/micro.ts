import {AbstractBroker, DefinitionHandlerPair, ActionHandler} from "../AbstractBroker";
import {Channel, connect, Connection, ConsumeMessage, Message, Options} from 'amqplib';
import {RequestMapper, RouteMapper} from "../IBroker";
import {Action, BaseRouteDefinition, QueueOptions} from "../../server/types";
import {AmqpClient, AmqpClientOptions} from "./AmqpClient";

export type IAmqpConfig = string | Options.Connect;
export type IAmqpExchangeConfig = { name: string, type: 'topic' | 'fanout' | 'direct', options?: Options.AssertExchange };
export type IAmqpBindingConfig = {queue: string, pattern: string};

export class AmqpBroker<T = IAmqpConfig> extends AbstractBroker<T> {
  protected connection!: Connection;
  protected channel!: Channel;
  public defaultExchange: IAmqpExchangeConfig = {type: 'direct', name: ""};
  private bindings: Map<IAmqpExchangeConfig, IAmqpBindingConfig[]> = new Map<IAmqpExchangeConfig, IAmqpBindingConfig[]>();

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
    } else {
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
    const options = {...defaultOptions, ...opts || {}};
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
        queueOptions = {...v.def.queueOptions};
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
      const exchanges: Array<{ exchange: string, pattern: string }> = [];
      /**
       * Find all associated bindings
       */
      this.bindings.forEach((values, key) => {
        const item = values.find(x => x.queue === route);
        if (item) {
          exchanges.push({exchange: key.name, pattern: item.pattern});
        }
      });
      /**
       * Bind the queue to all associated exchanges
       */
      if (exchanges.length) {
        for (let i = 0; i < exchanges.length; i++) {
          await this.channel.bindQueue(route, exchanges[i].exchange, exchanges[i].pattern);
        }
      }
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

  /**
   * Add single route, get its exchanges config and save it in the binding map
   * @param def
   * @param handler
   */
  public addRoute(def: BaseRouteDefinition, handler: ActionHandler): string {
    const hasDefaultExchange: boolean = !!this.defaultExchange && this.defaultExchange.name.length > 0;
    const hasCustomExchange: boolean = !!def.queueOptions && !!def.queueOptions.exchange && def.queueOptions.exchange.name.length > 0;
    let exchange: IAmqpExchangeConfig | undefined = undefined;
    let pattern: string | undefined = undefined;
    if (hasCustomExchange) {
      exchange = def.queueOptions!.exchange;
      pattern = def.queueOptions!.bindingPattern || "";
    } else if (hasDefaultExchange) {
      pattern = def.queueOptions && def.queueOptions.bindingPattern || "";
      exchange = this.defaultExchange;
    }
    /**
     * Call super method and get the resulting queue
     */
    const queue = super.addRoute(def, handler);
    /**
     * If any exchange exists
     */
    if (!!exchange) {
      /**
       * Find saved exchanges by name only, if an exchange configured more than 1 time with difference options,
       * keep the exchange with the first occurring options
       */
      const keys = Array.from(this.bindings.keys());
      const found = keys.find(x => x.name === exchange!.name);
      let bindings: { queue: string, pattern: string }[] = [];
      /**
       * If exchange found in current configuration, get the key and the value and delete it form the map,
       * Update the key with the new options, and reset it in the map with the new options and bindings
       */
      if (found) {
        bindings = this.bindings.get(found) || [];
        this.bindings.delete(found);
        found.options = found.options || exchange!.options;
        exchange = found;
      }
      bindings.push({queue, pattern: pattern || ""});
      this.bindings.set(exchange, bindings);
    }
    return queue;
  }

  /**
   * Assert every exchange
   */
  private async assertExchanges() {
    let exchanges = Array.from(this.bindings.keys());
    for (let i = 0; i < exchanges.length; i++) {
      await this.channel.assertExchange(exchanges[i].name, exchanges[i].type, exchanges[i].options);
    }
  }

  protected async registerRoutes() {
    await this.assertExchanges();
    const routes: Array<{ value: DefinitionHandlerPair[], route: string }> = [];
    /**
     * Convert key value to array
     */
    this.registeredRoutes.forEach((value: DefinitionHandlerPair[], route: string) => {
      routes.push({value, route});
    });
    /**
     * Await each item on registering the routes
     */
    for (let i = 0; i < routes.length; i++) {
      await this.registerSingleRoute(routes[i].value, routes[i].route);
    }
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
    /**
     * Reply if the message has rpcReply and correlationId
     */
    this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(body)), {correlationId, headers});
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
