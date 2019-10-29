import {FastifyBroker} from "./FastifyBroker";
import {IHttpListnerConfig} from "../HttpBroker";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IConfiguration} from "../../../server";
import {OptionsBuilder} from "../../../server";
import {BrokerResolver} from "../../BrokerResolver";
declare module "../../../server/OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build a fastify broker
     * @param builder
     */
    useFastifyBroker(builder: BrokerResolver<FastifyBrokerBuilder>): FastifyBroker;
  }
}

OptionsBuilder.prototype.useFastifyBroker = function(builder: BrokerResolver<FastifyBrokerBuilder>) {
  const broker_builder = new FastifyBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export class FastifyBrokerBuilder extends BrokerBuilder<FastifyBroker, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new FastifyBroker();
  }
}
export * from "./FastifyBroker";
