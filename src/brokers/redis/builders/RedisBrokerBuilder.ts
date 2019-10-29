// OTHER BROKER BUILDERS
import {RedisBroker, RedisConfig} from "../RedisBroker";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IConfiguration} from "../../../server";
import {OptionsBuilder} from "../../../server";
import {BrokerResolver} from "../../BrokerResolver";

declare module "../../../server/OptionsBuilder" {
  interface OptionsBuilder {
    /**
     * Build a redis broker
     * @param builder
     */
    useRedisBroker(builder: BrokerResolver<RedisBrokerBuilder>): RedisBroker;
  }
}

OptionsBuilder.prototype.useRedisBroker = function (builder: BrokerResolver<RedisBrokerBuilder>) {
  const broker_builder = new RedisBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export class RedisBrokerBuilder extends BrokerBuilder<RedisBroker, RedisConfig> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new RedisBroker(config);
  }
}
