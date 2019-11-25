import {IConfiguration, OptionsBuilder} from "../../../server";
import {BrokerResolver} from "../../BrokerResolver";
import {FastifyBroker} from "./FastifyBroker";
import {BrokerBuilder} from "../../BrokerBuilder";
import {IHttpListnerConfig} from "../HttpBroker";

declare module "../../../server/OptionsBuilder" {
  interface OptionsBuilder {
    /**
     * Build a fastify broker
     * @param builder
     */
    useFastifyBroker(builder: BrokerResolver<FastifyBrokerBuilder>): FastifyBroker;
  }
}

export class FastifyBrokerBuilder extends BrokerBuilder<FastifyBroker, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new FastifyBroker();
  }
}

OptionsBuilder.prototype.useFastifyBroker = function (builder: BrokerResolver<FastifyBrokerBuilder>) {
  const broker_builder = new FastifyBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export {FastifyBroker} from './FastifyBroker';
