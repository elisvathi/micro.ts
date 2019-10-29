import {ExpressBroker, ExpressBrokerBuilder} from "../ExpressBroker";
import {BrokerResolver} from "../../../BrokerResolver";
import {OptionsBuilder} from "../../../../server/OptionsBuilder";

declare module "../../../../server/OptionsBuilder"{
  interface OptionsBuilder {
    /**
     * Build an express broker
     * @param builder
     */
    useExpressBroker(builder: BrokerResolver<ExpressBrokerBuilder>): ExpressBroker;
  }
}

 OptionsBuilder.prototype.useExpressBroker = function(builder: BrokerResolver<ExpressBrokerBuilder>) {
  const broker_builder = new ExpressBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

