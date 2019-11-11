import {Action, IConfiguration, StartupBase} from "../src/server";
import {AmqpController, DatabaseController, TimeoutController} from "./controller";
import { OptionsBuilder } from "../src/server";
import { AppBuilder } from "../src/server";
import "../src/brokers/http/hapi"
import "../src/brokers/socketio";
import "../src/brokers/amqp";
import "../src/plugins/typeorm";
import { HapiBroker } from "../src/brokers/http/hapi";
import { TopicBasedAmqpBroker } from "../src/brokers/amqp";
import { Container, BaseConfiguration } from "../src";
import { AmqpClient } from "../src/brokers/amqp";
import config from 'config';

class Startup extends StartupBase {
  hapibroker!: HapiBroker;
  amqpbroker!: TopicBasedAmqpBroker;

  /**
   * Serve rconfiguration
   * @param builder
   */
  configureServer(builder: OptionsBuilder): void {
    /**
     * Base path
     */
    builder.setBasePath('api');
    /**
     * Basic flags
     */
    builder.setLogErrors(true);
    builder.setLogRequests(true);
    builder.setDevMode(true);
    // builder.setTimeout(100);
    /**
     * Global error handler, to log errors
     */
    builder.addErrorHandlers((err) => {
      console.log(err);
      return false;
    });
    /**
     * Setup http broker
     */
    this.hapibroker = builder.useHapiBroker(b => b.named("HAPI_BROKER").withConfigResolver(c => c.getFromPath('http.hapi')));
    /**
     * Setup socket.io broker
     */
    builder.useSocketIoBroker(b => b.named("SOCKET_BROKER").withConfig(this.hapibroker.getConnection().listener));
    /**
     * Setup amqp broker
     */
    this.amqpbroker = builder.useTopicBasedAmqpBroker(b => b.named("BROKER_DEFAULT_TOPIC").withConfig({ connection: "amqp://localhost", topic: "base" }));
    this.amqpbroker.defaultExchange = { name: "base-topic", type: 'direct' }
    /**
     * Register controllers
     */
    builder.addControllers(AmqpController, DatabaseController, TimeoutController);
    /**
     * Log all responses
     */
    // builder.addAfterMiddlewares((a: Action) => {
    //   console.log("Response", a.response);
    //   return a;
    // });
  }

  async beforeStart(): Promise<void> {
    console.log("CALLED BEFORE START");
  }

  async afterStart(): Promise<void> {
    const client: AmqpClient = await this.amqpbroker.createClient({ rpcQueue: "test" });
    Container.set(AmqpClient, client);
    console.log("CALLED AFTER START");
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
