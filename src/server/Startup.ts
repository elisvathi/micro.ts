import { ServerOptions } from "./types/ServerOptions";
import { IBroker } from "../brokers";
import { Class, Action } from "./types";
import { AppMiddleware } from "../middlewares/IMiddleware";
import { AppErrorHandler } from "../errors";
import { AuthorizeOptions } from "../decorators";

export type AuthorizationFunction = (action: Action, options?: AuthorizeOptions) => boolean;
export type CurrentUserCheckerFunction<TUser> = (action: Action, broker?: IBroker) => TUser;

export class AppBuilder {
  private options: ServerOptions = {
    brokers: [],
    controllers: [],
    beforeMiddlewares: [],
    afterMiddlewares: [],
    errorHandlers: [],
  }

  public get serverOptions(): ServerOptions {
    return this.options;
  }

  setDevMode(val: boolean): ServerOptions {
    this.options.dev = val;
    return this.options;
  }
  setLogRequests(val: boolean): ServerOptions {
    this.options.logRequests = val;
    return this.options;
  }

  setLogErrors(val: boolean): ServerOptions {
    this.options.logErrors = val;
    return this.options;
  }

  addBroker(broker: IBroker): ServerOptions {
    this.options.brokers!.push(broker);
    return this.options;
  }

  addControllers(...controllers: Class<any>[]): ServerOptions {
    this.options.controllers.push(...controllers);
    return this.options;
  }

  addBeforeMiddlewares(...middlewares: AppMiddleware[]): ServerOptions {
    this.options.beforeMiddlewares!.push(...middlewares);
    return this.options;
  }

  addAfterMiddlewares(...middlewares: AppMiddleware[]): ServerOptions {
    this.options.afterMiddlewares!.push(...middlewares);
    return this.options;
  }

  addErrorHandlers(...handlers: AppErrorHandler[]): ServerOptions {
    this.options.errorHandlers!.push(...handlers);
    return this.options;
  }

  useAuthorization(handler: AuthorizationFunction): ServerOptions {
    this.options.authorizationChecker = handler;
    return this.options;
  }

  useAuthentication<TUser>(checker: CurrentUserCheckerFunction<TUser>) {
    this.options.currentUserChecker = checker;
    return this.options;
  }
}

export abstract class BrokerBuilder<T extends Class<IBroker>> {
}

export abstract class Startup {
  private builder: AppBuilder = new AppBuilder();

  public getServerOptions(): ServerOptions {
    this.configureServices(this.builder);
    return this.builder.serverOptions;
  }

  public abstract configureServices(builder: AppBuilder): any;
}
