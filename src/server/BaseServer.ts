import chalk from 'chalk';
import { ServerOptions } from './types';
import { IBroker } from '../brokers';
import { GlobalMetadata, ControllerMetadata } from '../decorators';
import { getGlobalMetadata, getHandlerMetadata } from '../decorators/GlobalMetadata';
import { MiddlewareFunction, AppMiddelware, IMiddleware } from '../middlewares/IMiddleware';
import { BaseRouteDefinition, Action } from './types/BaseTypes';
import { Container } from '../di/BaseContainer';
import { MethodDescription, MethodControllerOptions, MiddlewareOptions, MethodOptions } from '../decorators/types/MethodMetadataTypes';
import { NotAuthorized, BadRequest } from '../errors/MainAppErrror';
import { ParamDescription, ParamOptions, ParamDecoratorType } from '../decorators/types/ParamMetadataTypes';
import { AppErrorHandler, IErrorHandler, ErrorHandlerFunction } from '../errors/types/ErrorHandlerTypes';

interface RegisterMethodParams {
  /** Name of the method */
  methodName: string;
  /** Method metadata */
  desc: MethodDescription;
  /** Base path of the app */
  basePath: string;
  /** Controller path */
  controllerPath: string;
  /** Controller constructor */
  ctor: any;
  /** Is JSON controller */
  isJson: boolean;
  /** List of filtered brokers */
  brokers: IBroker[];
  /** List of routes */
  routes: any[];
  /** Name of the controller class */
  controllerName: string;
}

export class BaseServer {
  constructor(private options: ServerOptions) { }

  private static get controllersMetadata(): GlobalMetadata {
    return getGlobalMetadata();
  }

  /**
   * Execute a single middleware and return its result
   * @param middleware Middleware function or IMiddleware instance to execute
   * @param def Route definition on which the middleware is being called from
   * @param action The action object, with the state of the action just before this middleware is being executed
   * @param controller The controller instance
   * @param broker The broker instance
   */
  private static async executeMiddleware(middleware: AppMiddelware, def: BaseRouteDefinition, action: Action, controller: any, broker: IBroker): Promise<Action> {
    if (middleware.prototype && ('do' in middleware.prototype)) {
      const casted: IMiddleware = Container.get(middleware.prototype.constructor);
      return casted.do(action, def, controller, broker);
    }
    return (middleware as MiddlewareFunction)(action, def, controller, broker);
  }

  /**
   * Execute the error handler and return its result as a boolean
   * @param handler Error handler function or IErrorHandler instance
   * @param error Error object
   * @param action Action object up to the state before the error
   * @param def Route definition where the error was thrown
   * @param controller The controller instance
   * @param broker The broker instance
   */
  private static async executeErrorHandler(handler: AppErrorHandler, error: any, action: Action, def: BaseRouteDefinition, controller: any, broker: IBroker) {
    if (handler.prototype && ('do' in handler.prototype)) {
      const casted: IErrorHandler = Container.get(handler.prototype.constructor);
      return casted.do(error, action, def, controller, broker);
    }
    return (handler as ErrorHandlerFunction)(error, action, def, controller, broker);
  }

  /**
   * If an error was thrown, the error object will go through all the error handlers sequentially until on of the handlers returns true
   * @param handlers List of handlers to execute
   * @param error Error object
   * @param action Action state on the moment the error was thrown
   * @param def Route definition where the error was thrown
   * @param controllerInstance The controller instance
   * @param broker The broker instance
   */
  private static async handleError(handlers: AppErrorHandler[], error: any, action: Action, def: BaseRouteDefinition, controllerInstance: any, broker: IBroker): Promise<boolean> {
    for (let i = 0; i < handlers.length; i++) {
      const result = await BaseServer.executeErrorHandler(handlers[i], error, action, def, controllerInstance, broker);
      if (result) {
        return true;
      }
    }
    return false;
  }

  /**
   * Execute the request (passing through all the middlewares)  and handle errors if thrown any
   * @param def Route definition
   * @param action Action from the broker
   * @param broker Broker instance
   */
  private async executeRequest(def: BaseRouteDefinition, action: Action, broker: IBroker) {
    const controllerInstance: any = Container.get(def.controllerCtor);
    const methodControllerMetadata: MethodControllerOptions = getHandlerMetadata(def.controllerCtor, def.handlerName);
    try {
      action = await this.handleRequest(def, action, broker, controllerInstance, methodControllerMetadata);
    } catch (err) {
      const errorHandlers: AppErrorHandler[] = this.getErrorHandlers(methodControllerMetadata);
      const handled = await BaseServer.handleError(errorHandlers, err, action, def, controllerInstance, broker);
      if (!handled) {
        action.response = action.response || {};
        action.response.statusCode = err.statusCode || 500;
        action.response.is_error = true;
        action.response.error = err;
        if (this.options.logErrors && action.response.statusCode === 500) {
          console.log(action);
        }
      }
    }
    /*
     * Log the request info if enabled
     */
    if (this.options.logRequests) {
      const response = action.response || {};
      const statusCode = response.statusCode || 200;
      console.log(chalk.greenBright(`[${broker.constructor.name}]`),
        chalk.blueBright(`[${def.method.toUpperCase()}]`),
        chalk.green(`[${def.controller}]`),
        chalk.yellow(`[${def.handlerName}]`),
        `${action.request.path}`,
        statusCode === 200 ? chalk.blue(`[${statusCode}]`) : chalk.red(`[${statusCode}]`));
    }
    return action;
  }

  /**
   * Checks if the action for the handler handler needs to pass through authorizationChecker function,
   * And executes the the authorizationChecker function, with the corresponding arguments
   * @param action Action object at the time of invocation
   * @param methodMetadata Metadata for the handler to check if the request should get filtered by authorization checker
   */
  private async checkAuthorization(action: Action, methodMetadata: MethodControllerOptions) {
    let shouldCheck = false;
    if (methodMetadata.controller.authorize) { shouldCheck = true }
    if (methodMetadata.method.authorize === false) {
      shouldCheck = false;
    } else if (methodMetadata.method.authorize === true) {
      shouldCheck = true;
    }
    if (shouldCheck && this.options.authorizationChecker) {
      const options = methodMetadata.method.authorization || methodMetadata.controller.authorization || {};
      const authorized = await this.options.authorizationChecker(action, options);
      if (!authorized) {
        throw new NotAuthorized("You are not authorized to make this request");
      }
    }
  }

  /**
   * Group an array of middleware options , with the before flag, into to groups, before middlewares and after middlewares
   * @param middlewares List of middleware options
   */
  private groupMiddlewares(middlewares: MiddlewareOptions[]): { before: AppMiddelware[], after: AppMiddelware[] } {
    const result: { before: AppMiddelware[], after: AppMiddelware[] } = { before: [], after: [] };
    middlewares.forEach(m => {
      if (m.before) {
        result.before.push(m.middleware);
      } else {
        result.after.push(m.middleware);
      }
    })
    return result;
  }

  /**
   * Get all middlewares for a specific handlers,
   * The sorting of middlewares in this method determines the sequence of the middleware executions
   * Before the handler is executed middlewares are executed on this order:
   * 1. App before middlewares,
   * 2. Controller before middlewares,
   * 3. Handler before middlewares
   * After the handler is executed after middlewares are executed in this order
   * 1. Handler after middlewares
   * 2. Controller's after middlewares
   * 3. App's after middlewares
   * @param methodMetadata
   */
  private getMiddlewares(methodMetadata: MethodControllerOptions): { before: any[], after: any[] } {
    const middlewares: { before: any[], after: any[] } = { before: [], after: [] };
    let afterMiddlewares: any[] = [];
    if (this.options.beforeMiddlewares && this.options.beforeMiddlewares.length > 0) {
      middlewares.before.push(...this.options.beforeMiddlewares);
    }
    if (this.options.afterMiddlewares && this.options.afterMiddlewares.length > 0) {
      afterMiddlewares.push(this.options.afterMiddlewares);
    }
    if (methodMetadata.controller.middlewares && methodMetadata.controller.middlewares.length > 0) {
      const groupedControllerMiddlewares = this.groupMiddlewares(methodMetadata.controller.middlewares);
      middlewares.before.push(...groupedControllerMiddlewares.before);
      afterMiddlewares.push(groupedControllerMiddlewares.after);
    }
    if (methodMetadata.method.middlewares && methodMetadata.method.middlewares.length > 0) {
      const groupedMethodMiddleware = this.groupMiddlewares(methodMetadata.method.middlewares);
      middlewares.before.push(...groupedMethodMiddleware.before);
      afterMiddlewares.push(groupedMethodMiddleware.after);
    }
    // Reverse after middlewares so they go in the order of 1. Handler Middlewares, 2. Controller Middlewares, 3. Global Middlewares
    afterMiddlewares = afterMiddlewares.reverse()
    afterMiddlewares.forEach(a => {
      middlewares.after.push(...a);
    });
    return middlewares;
  }

  /**
   * Build error handlers for the route, using first the method error handlers, then controller error handlers, and app-level error handlers
   * @param methodMetadata Metadata for the handler
   */
  private getErrorHandlers(methodMetadata: MethodControllerOptions) {
    const result: AppErrorHandler[] = [];
    result.push(...methodMetadata.method.errorHandlers || []);
    result.push(...methodMetadata.controller.errorHandlers || []);
    result.push(...this.options.errorHandlers || []);
    return result;
  }

  /**
   * Handle the before middlewares execution, handler execution, and after middlewares execution
   * @param def Route definition
   * @param action The action object from the broker
   * @param broker The broker instance
   * @param controllerInstance The controller instance (needs to be passed into the middlewares)
   * @param methodControllerMetadata Handler metadata
   */
  private async handleRequest(def: BaseRouteDefinition,
                              action: Action,
                              broker: IBroker,
                              controllerInstance: any,
                              methodControllerMetadata: MethodControllerOptions) {
    await this.checkAuthorization(action, methodControllerMetadata);
    const middlewares = this.getMiddlewares(methodControllerMetadata);
    if (middlewares.before.length) {
      for (let i = 0; i < middlewares.before.length; i++) {
        action = await BaseServer.executeMiddleware(middlewares.before[i], def, action, controllerInstance, broker);
      }
    }
    const args = await this.buildParams(action, methodControllerMetadata.method, broker);
    let result = await controllerInstance[def.handlerName](...args);
    action.response = action.response || {};
    action.response.headers = action.response.headers || {};
    action.response.statusCode = 200;
    action.response.body = result;
    if (middlewares.after.length) {
      for (let i = 0; i < middlewares.after.length; i++) {
        action = await BaseServer.executeMiddleware(middlewares.after[i], def, action, controllerInstance, broker);
      }
    }
    return action;
  }

  /**
   * Build the arguments list for the handler
   * @param action Action object
   * @param metadata
   * @param broker
   */
  private async buildParams(action: Action,
    metadata: MethodDescription, broker: IBroker): Promise<any[]> {
    return Promise.all(metadata.params.map(async (p) => {
      return this.buildSingleParam(action, p, broker);
    }));
  }

  /**
   * Execute currentUserChecker function, to get the user from a request, and inject it if required int the handlers arguments
   * @param action Action object with the request
   * @param broker Broker instance
   */
  private async getUser(action: Action, broker: IBroker): Promise<any> {
    if (!this.options.currentUserChecker) {
      return null;
    }
    return this.options.currentUserChecker(action, broker);
  }

  /**
   * Validate a single method argument
   * @param value Value of the argument
   * @param required If true and value is empty value it throws bad request
   * @param validate If true, and the validate function throws it throws bad request
   * @param name Key of the value in case is a single key option
   * @param type Type of parameter to use in validation
   */
  private async validateParam(value: any, required: boolean, validate: boolean, name?: any, type?: any): Promise<any> {
    if (required && !value) {
      throw new BadRequest(`${name} is required`);
    }
    if (validate && !!value && this.options.validateFunction) {
      try {
        const result = await this.options.validateFunction(value, type);
        return result || value;
      } catch (err) {
        throw new BadRequest("One or more errors with your request", err.details || err.message || err);
      }
    }
    return value;
  }

  /**
   * Switches through all the cases of param types and maps the correct information
   * @param action Action object after all before middlewares executed
   * @param metadata Metadata for the handler
   * @param broker Broker instance
   */
  private async buildSingleParam(action: Action,
    metadata: ParamDescription, broker: IBroker): Promise<any> {
    if (!metadata.options) {
      return action.request.body || action.request.qs || {};
    } else {
      const options: ParamOptions = metadata.options as ParamOptions;
      switch (options.decoratorType) {

        case ParamDecoratorType.Body:
          const body = action.request.body;
          return this.validateParam(body, options.bodyOptions!.required || false, options.bodyOptions!.validate || false, 'body', metadata.type);
        case ParamDecoratorType.BodyField:
          const bodyField = action.request.body[options.name as string]
          return this.validateParam(bodyField, options.bodyParamOptions!.required || false, false, options.name);

        case ParamDecoratorType.Params:
          const params = action.request.params;
          return this.validateParam(params, true, options.paramOptions!.validate || false, 'parameters', metadata.type);
        case ParamDecoratorType.ParamField:
          const paramField = action.request.params[options.name as string];
          return this.validateParam(paramField, true, false, options.name);

        case ParamDecoratorType.Method:
          return action.request.method;

        case ParamDecoratorType.Connection:
          return action.connection;
        case ParamDecoratorType.Request:
          return action;
        case ParamDecoratorType.RawRequest:
          return action.request.raw;
        case ParamDecoratorType.ContainerInject:
          return Container.get(options.name as any);
        case ParamDecoratorType.Broker:
          return broker;

        case ParamDecoratorType.Header:
          const headers = action.request.headers;
          return this.validateParam(headers, options.headerOptions!.validate || false, false, 'headers', metadata.type);
        case ParamDecoratorType.HeaderField:
          const headerParam = action.request.headers[options.name as string]
          return this.validateParam(headerParam, options.headerParamOptions!.required || false, false, options.name);

        case ParamDecoratorType.Query:
          let query = action.request.qs;
          if (Object.keys(query).length === 0) {
            query = undefined;
          }
          return this.validateParam(query, options.queryOptions!.required || false, options.queryOptions!.validate || false, 'query', metadata.type);
        case ParamDecoratorType.QueryField:
          const queryParam = action.request.qs[options.name as string];
          return this.validateParam(queryParam, options.queryParamOptions!.required || false, false, options.name);

        case ParamDecoratorType.User:
          const user = await this.getUser(action, broker);
          const required = options.currentUserOptions!.required || false;
          if (required && !user) {
            throw new NotAuthorized("You are not authorized to access this resource");
          }
          return user;
      }
    }
  }

  /**
   * Adds route to its corresponding brokers
   * @param def Route definition
   * @param brokers List of brokers enabled for this handler
   * @param params List of parameters required for this handler (to be used when generating API specifications)
   */
  private async addRoute(def: BaseRouteDefinition, brokers: IBroker[], params: ParamDescription[]) {
    const result: any = {};
    if (brokers && brokers.length) {
      for (let i = 0; i < brokers.length; i++) {
        const broker = brokers[i];
        const name = broker.constructor.name;
        const route = await broker.addRoute(def, (action: Action) => {
          return this.executeRequest(def, action, broker);
        });
        result[name] = route;
        const brokerServerInfo = this._serverInfo.get(broker) || [];
        brokerServerInfo.push({ route, def, params });
        this._serverInfo.set(broker, brokerServerInfo);
      }
    }
    return result;
  }

  /**
   * Registers all routes to the brokers
   * Initializes all brokers
   */
  public async start() {
    this.buildRoutes();
    if (this.options.brokers) {
      await Promise.all(this.options.brokers.map(async (x) => {
        await x.start();
      }));
      console.log("SERVER STARTED");
    }
  }

  private _serverInfo: Map<IBroker, { route: string, def: BaseRouteDefinition, params: ParamDescription[] }[]> = new Map<IBroker, { route: string, def: BaseRouteDefinition, params: ParamDescription[] }[]>();

  public get serverInfo(): Map<IBroker, { route: string, def: BaseRouteDefinition, params: ParamDescription[] }[]> {
    return this._serverInfo;
  }

  /**
   * Build route for a single handler
   * @param param0
   */
  private async buildSingleMethodRoute({ methodName, desc, basePath, controllerPath, ctor, isJson, brokers, routes, controllerName }: RegisterMethodParams) {
    const metadata: MethodOptions = desc.metadata || {};
    const methodPath = metadata.path;
    let path = methodPath || methodName;
    if (methodPath === "") {
      path = methodPath;
    }
    const reqMethod = metadata.method;
    const handlerBrokersFilter = metadata.brokers;
    let methodBrokers = [...brokers];
    if (handlerBrokersFilter) {
      methodBrokers = methodBrokers.filter(handlerBrokersFilter);
    }
    const routeDefinition: BaseRouteDefinition = {
      base: basePath,
      controller: controllerPath,
      controllerCtor: ctor,
      handler: path,
      handlerName: methodName,
      method: reqMethod || 'get',
      queueOptions: metadata.queueOptions,
      json: isJson
    };
    const results = await this.addRoute(routeDefinition, methodBrokers, desc.params || []);
    const brokerNames = methodBrokers.map(x => {
      return x.constructor.name;
    }).join(", ");
    routes.push({
      brokers: brokerNames,
      method: (reqMethod || 'get').toUpperCase(),
      handler: `${controllerName}.${methodName}`,
      ...results
    })
  }

  /**
   * Build routes for a single controller
   * @param controllerMetadata Controller metadata
   * @param basePath Base path of the app
   * @param routes All the routes of the controller
   * @param brokers All the brokers filtered for this controller
   */
  private async buildSingleControllerRoute(controllerMetadata: ControllerMetadata, basePath: string, routes: any[], brokers: IBroker[]) {
    if (this.options.controllers.includes(controllerMetadata.ctor)) {
      const name = controllerMetadata.name;
      let options = controllerMetadata.options;
      options = options || {};
      let controllerBrokers = [...brokers];
      if (options.brokersFilter) {
        controllerBrokers = controllerBrokers.filter(options.brokersFilter)
      }
      const cPath = options.path;
      const isJson = !!options.json;
      const controllerPath = cPath || name;
      const handlers = controllerMetadata.handlers as any;
      await Promise.all(Object.keys(handlers).map(async (key) => {
        await this.buildSingleMethodRoute({
          methodName: key,
          desc: (controllerMetadata.handlers || {})[key],
          basePath,
          controllerPath,
          ctor: controllerMetadata.ctor,
          isJson,
          brokers: controllerBrokers,
          routes, controllerName: name
        });
      }));
    }

  }

  /**
   * Build all the routes for all the app's controllers
   * @param controllers Metadata for all registered controllers
   */
  private async buildAllControllers(controllers: ControllerMetadata[]) {
    const routes: { brokers: string, method: string, [key: string]: any }[] = [];
    const basePath = this.options.basePath || "";
    let brokers = this.options.brokers || [];
    await Promise.all(controllers.map(async (c) => {
      await this.buildSingleControllerRoute(c, basePath, routes, brokers);
    }));
    return routes;
  }

  /**
   * Gets all the controllers metadata and build all the routes
   * Displays route table on the screen
   */
  public async buildRoutes() {
    let controllers = BaseServer.controllersMetadata.controllers;
    const routes = await this.buildAllControllers(Array.from(controllers.values()));
    console.table(routes);
  }

}
