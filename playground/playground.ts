import config from 'config';
import "../src/brokers/amqp";
import "../src/brokers/http/hapi";
import "../src/brokers/socketio";
import "../src/plugins/typeorm";
import { AppBuilder, IConfiguration, OptionsBuilder, StartupBase } from "../src/server";
import { DataController } from './controllers/DataController';

class Startup extends StartupBase {

  public async beforeStart(): Promise<void> {
  }

  public async afterStart(): Promise<void> {
  }

  public configureServer(builder: OptionsBuilder): void {
    builder.setDevMode(true);
    builder.setLogRequests(true);
    builder.setLogErrors(true);
    // builder.useTypeOrm(config.get('database'));
    // builder.addModels(User);
    builder.addControllers(DataController);
    builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath("http.hapi")));
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
