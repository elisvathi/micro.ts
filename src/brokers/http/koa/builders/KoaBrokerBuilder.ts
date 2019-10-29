import {KoaBroker} from "../KoaBroker";
import {IHttpListnerConfig} from "../../HttpBroker";
import {BrokerBuilder} from "../../../BrokerBuilder";
import {IConfiguration} from "../../../../server/IConfiguration";
import {OptionsBuilder} from "../../../../server/OptionsBuilder";
import {BrokerResolver} from "../../../BrokerResolver";
declare module "../../../../server/OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build a koa broker
     * @param builder
     */
    useKoaBroker(builder: BrokerResolver<KoaBrokerBuilder>) : KoaBroker;
  }
}

OptionsBuilder.prototype.useKoaBroker = function(builder: BrokerResolver<KoaBrokerBuilder>) {
  const broker_builder = new KoaBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export class KoaBrokerBuilder extends BrokerBuilder<KoaBroker, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new KoaBroker(config);
  }
}
