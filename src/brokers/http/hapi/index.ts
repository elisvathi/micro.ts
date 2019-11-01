// HTTP BROKER BUILDERS
import {ServerOptions as HapiServerOptions} from "hapi";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IConfiguration} from "../../../server";
import {OptionsBuilder} from "../../../server";
import {BrokerResolver} from "../../BrokerResolver";
import {HapiBroker} from "./HapiBroker";
declare module "../../../server/OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build a hapi broker
     * @param builder
     */
    useHapiBroker(builder?: BrokerResolver<HapiBrokerBuilder>) : HapiBroker;
  }
}

OptionsBuilder.prototype.useHapiBroker = function (builder: BrokerResolver<HapiBrokerBuilder>) {
  const broker_builder = new HapiBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  const brokers = this.options.brokers || [];
  brokers.push(broker);
  this.options.brokers = brokers;
  return broker;
};

export class HapiBrokerBuilder extends BrokerBuilder<HapiBroker, HapiServerOptions> {
  constructor(cfg: IConfiguration) {
    super(cfg);
    this.broker = new HapiBroker();
  }
}
export * from './HapiBroker';
