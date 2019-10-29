import {StartupBase} from "../src/server";
import {TestController} from "./controller";
import {OptionsBuilder} from "../src/server";
import {AppBuilder} from "../src/server";
import {IConfiguration} from "../src/server";
import {TopicBasedAmqpBroker} from "../src/brokers/amqp/TopicBasedAmqpBroker";
import "../src/brokers/http/hapi/builders/HapiBrokerBuiler"
import "../src/brokers/amqp/builders/TopicBasedAmqpBuilder"
import "../src/brokers/http/express/builders/ExpressBrokerBuilder"
import {HapiBroker} from "../src/brokers/http/hapi/HapiBroker";

class BaseConfig implements IConfiguration{
  getFromPath<T>(path: string): T {
    return (path as any) as T;
  }
}

class Startup extends StartupBase {
  ampBroker!: TopicBasedAmqpBroker;
  hapibroker!: HapiBroker;

  configureServer(builder: OptionsBuilder): void {
    builder.setBasePath('api');
    this.hapibroker = builder.useHapiBroker(b=>b.withConfigResolver(c=>c.getFromPath('http.hapi')));
    // this.ampBroker = builder.useTopicBasedAmqpBroker(b=>b.withConfig({topic: "api", connection:"amqp://localhost"}))
    builder.addControllers(TestController);
  }

  async beforeStart(): Promise<void> {
    console.log("CALLED BEFORE START");
  }

  async afterStart(): Promise<void> {
    // const connection = this.ampBroker.getConnection();
    // Container.set("amqpConnection", connection);
    console.log("CALLED AFTER START");
  }

}
async function main() {
  const builder = new AppBuilder(new BaseConfig()).useStartup(Startup);
  await builder.start();
}

main().catch(console.log);
