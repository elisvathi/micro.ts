// HTTP BROKER BUILDERS
import {ServerOptions as HapiServerOptions} from "hapi";
import {BrokerBuilder} from "./BrokerBuilder";
import {IConfiguration} from "../IConfiguration";
import {OptionsBuilder} from "../OptionsBuilder";
import {BrokerResolver} from "./BrokerResolver";
import {HapiBroker} from "../../brokers/http/hapi/HapiBroker";
declare module "../OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build a hapi broker
     * @param builder
     */
    useHapiBroker(builder: BrokerResolver<HapiBrokerBuiler>) : HapiBroker;
  }
}

OptionsBuilder.prototype.useHapiBroker = function (builder: BrokerResolver<HapiBrokerBuiler>) {
  const broker_builder = new HapiBrokerBuiler(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};
export class HapiBrokerBuiler extends BrokerBuilder<HapiBroker, HapiServerOptions> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new HapiBroker(config);
  }
}
