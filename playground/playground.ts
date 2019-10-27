import {AppBuilder, IConfiguration, OptionsBuilder, StartupBase} from "../src/server/StartupBase";
import config from 'config';
import {TestController} from "./controller";
import "./extensions";

class BaseConfig implements IConfiguration{
  getFromPath<T>(path: string): T {
    return config.get(path);
  }
}
class Startup extends StartupBase {
  configureServer(builder: OptionsBuilder): void {
    builder.setBasePath('api');
    builder.useHapiBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('http.hapi')));
    builder.useExpressBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('http.express')));
    builder.useKoaBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('http.koa')));
    builder.useFastifyBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('http.fastify')));
    builder.useAmqpBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('amqp')));
    builder.useRedisBroker(b=>b.withConfiguration(cfg=>cfg.getFromPath('redis')));
    builder.addControllers(TestController);
  }

  async afterStart(): Promise<void> {
    console.log("CALLED AFTER START");
  }

  async beforeStart(): Promise<void> {
    console.log("CALLED BEFORE START");
  }

}


async function main() {
  const builder = new AppBuilder(new BaseConfig()).useStartup(Startup);
  builder.useStartup(Startup);
  await builder.start();
}

main().catch(console.log);
