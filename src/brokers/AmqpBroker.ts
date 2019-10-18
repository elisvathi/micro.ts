import { AbstractBroker, DefinitionHandlerPair } from "./AbstractBroker";
import { Connection, Channel, connect, Message, ConsumeMessage } from 'amqplib';
import { RequestMapper, RouteMapper } from "./IBroker";
import { Action, BaseRouteDefinition, QueueOptions } from "../server/types/BaseTypes";

export class AmqpBroker extends AbstractBroker {
  protected connection!: Connection;
  protected channel!: Channel;
  constructor(
    private options: {
      url: string;
    }) {
    super();
  }
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

  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    return `${def.base}.${def.controller}.${def.handler}`.replace(/\//g, '.');
  };

  public getConnection(): Connection {
    return this.connection;
  }

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

  protected async registerSingleRoute(value: DefinitionHandlerPair[], route: string): Promise<boolean> {
    let json = false;
    let totalConsumers = 0;
    let queueOptions: QueueOptions = {};
    value.forEach(v => {
      if (!queueOptions && v.def.queueOptions) {
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
      for (let i = 0; i < totalConsumers; i++) {
        await this.channel.consume(route, async (message: ConsumeMessage | null) => {
          await this.consumeMessage(route, message, value, json);
        });
      }
      return true;
    }else{
      return false;
    }
  }

  protected async registerRoutes() {
    this.registeredRoutes.forEach(async (value: DefinitionHandlerPair[], route: string): Promise<void> => {
      await this.registerSingleRoute(value, route);
    });
  }

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
  public async start(): Promise<void> {
    this.connection = await connect(this.options.url);
    this.channel = await this.connection.createChannel();
    await this.registerRoutes();
    console.log(`AMQP Connected on path ${this.options.url}`);
  }
}
