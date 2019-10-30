import {ExpressBroker} from "./ExpressBroker";
import {BrokerResolver} from "../../BrokerResolver";
import {OptionsBuilder} from "../../../server";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IHttpListnerConfig} from "../HttpBroker";
import {IConfiguration} from "../../../server";

export class ExpressBrokerBuilder extends BrokerBuilder<ExpressBroker, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new ExpressBroker();
  }
}

declare module "../../../server/OptionsBuilder" {
  interface OptionsBuilder {
    /**
     * Build an express broker
     * @param builder
     */
    useExpressBroker(builder: BrokerResolver<ExpressBrokerBuilder>): ExpressBroker;
  }
}

/**
 * Extend the OptionBuilder class
 * @param builder
 */
OptionsBuilder.prototype.useExpressBroker = function (builder: BrokerResolver<ExpressBrokerBuilder>) {
  const broker_builder = new ExpressBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export * from './ExpressBroker';
