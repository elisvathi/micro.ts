import { Action, Class, ServerOptions } from "./types";
import { AppErrorHandler, AppMiddleware, AuthorizeOptions } from "..";
import { IConfiguration } from "./IConfiguration";
import {IBroker} from "../brokers/IBroker";

export type CurrentUserCheckerFunction<TUser> = (action: Action, broker?: IBroker) => TUser | Promise<TUser>;
export type AuthorizationFunction = (action: Action, options?: AuthorizeOptions) => boolean | Promise<boolean>;
export type ValidateFunction = <T>(value: any, type: Class<T>)=>Promise<T>;

export class OptionsBuilder {
  constructor(public config: IConfiguration) {
  }

  public options: ServerOptions = {
    brokers: [],
    controllers: [],
    beforeMiddlewares: [],
    afterMiddlewares: [],
    errorHandlers: [],
  };

  /**
   * Return the built options
   */
  public get serverOptions(): ServerOptions {
    return this.options;
  }

  /**
   * Enable or disable developer mode
   * Returns the full error stack (Not yet implemented)
   * @param val
   */
  public setDevMode(val: boolean): OptionsBuilder {
    this.options.dev = val;
    return this;
  }

  /**
   * Base path for all the endpoints
   * @param val
   */
  setBasePath(val: string): OptionsBuilder {
    this.options.basePath = val;
    return this;
  }

  /**
   * Enable or disable request logging
   * @param val
   */
  public setLogRequests(val: boolean): OptionsBuilder {
    this.options.logRequests = val;
    return this;
  }

  /**
   * Enable or disable server errors logging
   * @param val
   */
  public setLogErrors(val: boolean): OptionsBuilder {
    this.options.logErrors = val;
    return this;
  }

  /**
   * Add a prebuilt broker
   * @param broker
   */
  public addBroker(broker: IBroker) {
    this.options.brokers!.push(broker);
  }

  /**
   * Add a list of controllers to the server
   * @param controllers
   */
  public addControllers(...controllers: Class<any>[]): OptionsBuilder {
    this.options.controllers.push(...controllers);
    return this;
  }

  /**
   * Add middlewares that get executed before any request handling, on all requests
   * @param middlewares
   */
  public addBeforeMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
    this.options.beforeMiddlewares!.push(...middlewares);
    return this;
  }

  /**
   * Add middlewares that get executed after all successfully handled requests
   * @param middlewares
   */
  public addAfterMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
    this.options.afterMiddlewares!.push(...middlewares);
    return this;
  }

  /**
   * Add global error handlers
   * @param handlers
   */
  public addErrorHandlers(...handlers: AppErrorHandler[]): OptionsBuilder {
    this.options.errorHandlers!.push(...handlers);
    return this;
  }

  /**
   * Add authorization function to be called on @Authorized routes
   * @param handler
   */
  public useAuthorization(handler: AuthorizationFunction): OptionsBuilder {
    this.options.authorizationChecker = handler;
    return this;
  }

  /**
   * Add user returning function for all the requests
   * @param checker
   */
  public useAuthentication<TUser>(checker: CurrentUserCheckerFunction<TUser>): OptionsBuilder {
    this.options.currentUserChecker = checker;
    return this;
  }

  /**
   * Set validate function
   * @param func
   */
  public setValidateFunction(func: ValidateFunction){
    this.options.validateFunction = func;
    return this;
  }
}
