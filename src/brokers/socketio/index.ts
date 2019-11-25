import {SocketIOBroker, SocketIOConfig} from "./SocketIOBroker";
import {BrokerBuilder} from "../BrokerBuilder";
import {IConfiguration, OptionsBuilder} from "../../server";
import {BrokerResolver} from "../BrokerResolver";

declare module "../../server/OptionsBuilder" {
  interface OptionsBuilder {
    /**
     * Build a SocketIO broker
     * @param builder
     */
    useSocketIoBroker(builder: BrokerResolver<SocketIoBrokerBuilder>): SocketIOBroker;
  }
}

OptionsBuilder.prototype.useSocketIoBroker = function (builder: BrokerResolver<SocketIoBrokerBuilder>) {
  const broker_builder = new SocketIoBrokerBuilder(this.config);
  const broker = builder(broker_builder).getBroker();
  this.options.brokers!.push(broker);
  return broker;
};

export class SocketIoBrokerBuilder extends BrokerBuilder<SocketIOBroker, SocketIOConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.broker = new SocketIOBroker();
  }
}
export * from "./SocketIOBroker";
