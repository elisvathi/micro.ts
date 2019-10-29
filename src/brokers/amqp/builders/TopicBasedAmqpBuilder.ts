import {TopicBasedAmqpBroker, TopicBasedAmqpConfig} from "../TopicBasedAmqpBroker";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IConfiguration} from "../../../server/IConfiguration";

import {OptionsBuilder} from "../../../server/OptionsBuilder";
import {BrokerResolver} from "../../BrokerResolver";

export class TopicBasedAmqpBuilder extends BrokerBuilder<TopicBasedAmqpBroker, TopicBasedAmqpConfig> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new TopicBasedAmqpBroker(config);
  }
}

declare module "../../../server/OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build a topic based amqp broker
     * Use this broker instead of simple AMQP broker, if you need requests to pass through a topic exchange
     * and route using automatic RoutingKeys
     * @param builder
     */
    useTopicBasedAmqpBroker(builder: BrokerResolver<TopicBasedAmqpBuilder>) : TopicBasedAmqpBroker;
  }
}

OptionsBuilder.prototype.useTopicBasedAmqpBroker  = function (builder: BrokerResolver<TopicBasedAmqpBuilder>) {
  const broker_builder = new TopicBasedAmqpBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

