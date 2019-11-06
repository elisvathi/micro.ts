import {IConfiguration, OptionsBuilder} from "../../server";
import {BrokerResolver} from "../BrokerResolver";
import {AmqpBroker} from "./AmqpBroker";
import {TopicBasedAmqpBroker} from "./TopicBasedAmqpBroker";
import {BrokerBuilder} from "../BrokerBuilder";
import {IAmqpConfig, TopicBasedAmqpConfig} from "./types";

export class AmqpBrokerBuilder extends BrokerBuilder<AmqpBroker, IAmqpConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new AmqpBroker();
  }
}

export class TopicBasedAmqpBuilder extends BrokerBuilder<TopicBasedAmqpBroker, TopicBasedAmqpConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new TopicBasedAmqpBroker();
  }
}

declare module "../../server/OptionsBuilder" {
  interface OptionsBuilder {
    useAmqpBroker(builder: BrokerResolver<AmqpBrokerBuilder>): AmqpBroker;

    /**
     * Build a topic based amqp broker
     * Use this broker instead of simple AMQP broker, if you need requests to pass through a topic exchange
     * and route using automatic RoutingKeys
     * @param builder
     */
    useTopicBasedAmqpBroker(builder: BrokerResolver<TopicBasedAmqpBuilder>): TopicBasedAmqpBroker;
  }
}

OptionsBuilder.prototype.useAmqpBroker = function (builder: BrokerResolver<AmqpBrokerBuilder>) {
  const broker_builder = new AmqpBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

OptionsBuilder.prototype.useTopicBasedAmqpBroker = function (builder: BrokerResolver<TopicBasedAmqpBuilder>) {
  const broker_builder = new TopicBasedAmqpBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export * from './AmqpClient';
export * from './TopicBasedAmqpBroker';
export * from './AmqpBroker';
export {IAmqpConnectionHooks} from "./types";
export {IAmqpBindingConfig} from "./types";
export {IAmqpExchangeConfig} from "./types";
export {IAmqpConfig} from "./types";
export {TopicBasedAmqpConfig} from "./types";
