import {StartupBase} from "../src/server";
import {TestController} from "./controller";
import {OptionsBuilder} from "../src/server";
import {AppBuilder} from "../src/server";
import {IConfiguration} from "../src/server";
import "../src/brokers/http/hapi"
import "../src/brokers/http/express"
import "../src/brokers/socketio";
import {HapiBroker} from "../src/brokers/http/hapi";
import config from 'config';

class BaseConfig implements IConfiguration {
  getFromPath<T>(path: string): T {
    return config.get(path);
    // return (path as any) as T;
  }
}

class Startup extends StartupBase {
  hapibroker!: HapiBroker;

  configureServer(builder: OptionsBuilder): void {
    builder.setBasePath('api');
    builder.setLogErrors(true);
    builder.setLogRequests(true);
    builder.setDevMode(true);
    this.hapibroker = builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath('http.hapi')));
    builder.useSocketIoBroker(b=>b.withConfig(this.hapibroker.getConnection().listener));
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
