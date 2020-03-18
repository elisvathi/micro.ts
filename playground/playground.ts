import config from 'config';
import "../src/brokers/amqp";
import "../src/brokers/http/hapi";
import "../src/brokers/socketio";
import "../src/plugins/typeorm";
import { AppBuilder, IConfiguration, OptionsBuilder, StartupBase } from "../src/server";
import { DataController } from './controllers/DataController';
import { UsersController } from './controllers/UsersController';
import { IMiddleware, Action, BaseRouteDefinition, Forbidden} from '../src';
import {IBroker} from '../src/brokers/IBroker';

class InterruptMiddleware implements IMiddleware {
  do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker<any>, send?: (data: any) => Action): Action | Promise<Action> {
    // if(send){
    //   return send({ok: true});
    // }
    return action;
  }
}

class Startup extends StartupBase {

  public async beforeStart(): Promise<void> {
  }

  public async afterStart(): Promise<void> {
  }

  public configureServer(builder: OptionsBuilder): void {
    builder.setDevMode(true);
    builder.setLogRequests(true);
    builder.setLogErrors(true);
    builder.addBeforeMiddlewares(InterruptMiddleware);
    builder.addControllers(DataController, UsersController);
    builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath("http.hapi")));
    builder.useAmqpBroker(b=>b.withConfigResolver(c=>c.getFromPath("amqp.url")));
    builder.useAuthorization((a: Action, options: any)=>{
      return false;
    });
    builder.setAuthorizationError((a: Action, options: any)=>{
      return new Forbidden("You are not authorized to use this feature");
    });
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
