import { BaseConfiguration, Container } from "../src";
import "../src/brokers/amqp";
import { AmqpClient, TopicBasedAmqpBroker } from "../src/brokers/amqp";
import { CommandBroker } from "../src/brokers/command/CommandBroker";
import "../src/brokers/http/hapi";
import { HapiBroker } from "../src/brokers/http/hapi";
import "../src/brokers/socketio";
import "../src/plugins/typeorm";
import { AppBuilder, OptionsBuilder, StartupBase, BaseServer , ServerOptions, IConfiguration} from "../src/server";
import { AmqpController } from './AmqpController';
import { TestController } from './TestController';
import { TestErrorHandler } from './TestErrorHandler';
import { Log } from "../src/server/Logger";
import chalk from "chalk";
import config from 'config';
import { BufferJsonTransformer, BufferStringTransformer } from "../src/transformers/types";

class Startup extends StartupBase {
  hapibroker!: HapiBroker;
  amqpbroker!: TopicBasedAmqpBroker;

  configureServer(builder: OptionsBuilder): void {
    builder.setBasePath('api');
    builder.setLogErrors(true);
    builder.setLogRequests(true);
    builder.setDevMode(true);
    this.hapibroker = builder.useHapiBroker(b => b.named("HAPI_BROKER").withConfigResolver(c => c.getFromPath('http.hapi')));
    builder.useHapiBroker(b=>b.withConfigResolver(c=>c.getFromPath("http.hapi2")))
    builder.useSocketIoBroker(b => b.named("SOCKET_BROKER").withConfig(this.hapibroker.getConnection().listener));
    this.amqpbroker = builder.useTopicBasedAmqpBroker(b => b.named("BROKER_DEFAULT_TOPIC").withConfig({ connection: "amqp://localhost", topic: "base" }));
    this.amqpbroker.defaultExchange = { name: "base-topic", type: 'direct' };
    const commandBroker: CommandBroker = new CommandBroker({port: 5001, stdin: false, hostname: '0.0.0.0', prompt: chalk.yellow("PLAYGROUND->$ ")});
    commandBroker.name = "COMMAND";
    builder.addControllers(AmqpController, TestController)
    builder.addBroker(commandBroker);
  }

  async beforeStart(): Promise<void> {
    Log.debug("CALLED BEFORE START");
  }

  async afterStart(): Promise<void> {
    const client: AmqpClient = await this.amqpbroker.createClient({ rpcQueue: "test" });
    Container.set(AmqpClient, client);
    Log.debug("CALLED AFTER START");
  }

}
class DefaultConfig implements IConfiguration{
  getFromPath<T>(path: string): T {
    return config.get(path);
  }
}
async function main() {
  const builder = new AppBuilder(new DefaultConfig()).useStartup(Startup);
  await builder.start();
}

main().catch(console.log);
