import config from 'config';
import "../src/brokers/amqp";
import "../src/brokers/http/hapi";
import "../src/brokers/socketio";
import "../src/plugins/typeorm";
import { AppBuilder, IConfiguration, OptionsBuilder, StartupBase } from "../src/server";
import { DataController } from './controllers/DataController';
import { UsersController } from './controllers/UsersController';

class Startup extends StartupBase {

  public async beforeStart(): Promise<void> {
  }

  public async afterStart(): Promise<void> {
  }

  public configureServer(builder: OptionsBuilder): void {
    builder.setDevMode(true);
    builder.setLogRequests(true);
    builder.setLogErrors(true);
    builder.addControllers(DataController, UsersController);
    builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath("http.hapi")));
    // builder.useHapiBroker(b => b.named('private').withConfigResolver(c => c.getFromPath("http.private")));
  }

}

class DefaultConfig implements IConfiguration {
  getFromPath<T>(path: string): T {
    return config.get(path);
  }

}
async function main() {
  const builder = new AppBuilder(new DefaultConfig()).useStartup(Startup);
  await builder.start();
}

main().catch(console.log);
