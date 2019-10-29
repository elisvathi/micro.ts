import {BrokerBuilder} from "../../BrokerBuilder";
import {IConfiguration, OptionsBuilder} from "../../../server";
import {AmqpBroker, IAmqpConfig} from "../AmqpBroker";
import {BrokerResolver} from "../../BrokerResolver";

export class AmqpBrokerBuilder extends BrokerBuilder<AmqpBroker, IAmqpConfig> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new AmqpBroker(config);
  }
}

declare module "../../../server/OptionsBuilder" {
  interface OptionsBuilder {
    useAmqpBroker(builder: BrokerResolver<AmqpBrokerBuilder>): AmqpBroker;
  }
}

OptionsBuilder.prototype.useAmqpBroker = function (builder: BrokerResolver<AmqpBrokerBuilder>) {
  const broker_builder = new AmqpBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};
