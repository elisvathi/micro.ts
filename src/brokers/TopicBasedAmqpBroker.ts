import {AmqpBroker, IAmqpConfig} from "./AmqpBroker";
import { RequestMapper } from "./IBroker";
import {Message, ConsumeMessage, connect} from "amqplib";
import { Action } from "../server/types/BaseTypes";
import { DefinitionHandlerPair } from "./AbstractBroker";
import {IConfiguration} from "../server/StartupBase";
export interface TopicBasedAmqpConfig {
  connection: IAmqpConfig;
  topic: string;
}
export class TopicBasedAmqpBroker extends AmqpBroker<TopicBasedAmqpConfig> {
  constructor(config:IConfiguration) {
    super(config);
  }

  public get baseTopic(): string {
    return this.config.topic;
  }

  protected requestMapper: RequestMapper = (r: Message, queue: string, routingKey: string, json: boolean) => {
    const superRequest = super.requestMapper(r, queue, json);
    const routingKeySplit = routingKey.split('.');
    const queueSplit = this.extractQueueParamNames(queue);
    const params: any = {};
    if (routingKeySplit.length === queueSplit.length) {
      queueSplit.forEach((item, index) => {
        if (item.param) {
          params[item.name] = routingKeySplit[index];
        }
      })
    };
    superRequest.request.params = params;
    return superRequest;
  };

  protected async consumeMessage(route: string,
    message: ConsumeMessage | null,
    value: DefinitionHandlerPair[],
    json: boolean) {
    if (message) {
      const routingKey = message.fields.routingKey;
      const mapped: Action = this.requestMapper(message, route, routingKey, json);
      const handler = this.actionToRouteMapper(route, mapped, value);
      const result = await handler(mapped);
      if (result && message.properties.replyTo && message.properties.correlationId) {
        await this.rpcReply(result, message.properties.replyTo, message.properties.correlationId);
      }
      this.channel.ack(message);
    }
  }

  protected async registerSingleRoute(value: DefinitionHandlerPair[], route: string) {
    const result = await super.registerSingleRoute(value, route);
    if (result) {
      await this.channel.bindQueue(route, this.baseTopic, TopicBasedAmqpBroker.getQueuePattern(route));
    }
    return result;
  }

  protected async registerRoutes() {
    await this.channel.assertExchange(this.baseTopic, 'topic', { autoDelete: true });
    super.registerRoutes();
  }

  private static getQueuePattern(queue: string) {
    return queue.split(".").map(x => {
      if (x.length > 0 && x[0] === ':') {
        return '#'
      }
      return x;
    }).join('.');
  }

  private extractQueueParamNames(queue: string) {
    return this.extractParamNames(queue, '.');
  }

  protected get connectionConfig(): IAmqpConfig{
    return this.config.connection;
  }

}
