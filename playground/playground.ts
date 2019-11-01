import {StartupBase} from "../src/server";
import {AmqpController, TestController} from "./controller";
import {OptionsBuilder} from "../src/server";
import {AppBuilder} from "../src/server";
import "../src/brokers/http/hapi"
import "../src/brokers/socketio";
import "../src/brokers/amqp";
import {HapiBroker} from "../src/brokers/http/hapi";
import { AmqpBroker } from "../src/brokers/amqp";
import { Container, BaseConfiguration } from "../src";
import { AmqpClient } from "../src/brokers/amqp/AmqpClient";

class Startup extends StartupBase {
  hapibroker!: HapiBroker;
  amqpbroker!: AmqpBroker;

  configureServer(builder: OptionsBuilder): void {
    builder.setBasePath('api');
    builder.setLogErrors(true);
    builder.setLogRequests(true);
    builder.setDevMode(true);
    this.hapibroker = builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath('http.hapi')));
    builder.useSocketIoBroker(b=>b.withConfig(this.hapibroker.getConnection().listener));
    this.amqpbroker = builder.useAmqpBroker(b=>b.withConfig("amqp://localhost"));
    builder.addControllers(TestController, AmqpController);
  }

  async beforeStart(): Promise<void> {
    console.log("CALLED BEFORE START");
  }

  async afterStart(): Promise<void> {
    const client: AmqpClient = await this.amqpbroker.createClient();
    Container.set(AmqpClient, client);
    console.log("CALLED AFTER START");
  }

}

async function main() {
  const builder = new AppBuilder(new BaseConfiguration()).useStartup(Startup);
  await builder.start();
}

main().catch(console.log);
