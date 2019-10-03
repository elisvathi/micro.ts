import chalk from 'chalk';
import { ServerOptions } from './types/ServerOptions';
import { IBroker } from '../brokers/IBroker';
import { GlobalMetadata } from '../decorators/types/ControllerMetadataTypes';
import { getGlobalMetadata, getHandlerMetadata } from '../decorators/GlobalMetadata';
import { MiddlewareFunction, IMiddleware, AppMiddelware } from '../middlewares/IMiddleware';
import { BaseRouteDefinition, Action } from './types/BaseTypes';
import { Container } from '../di/BaseContainer';
import { MethodDescription, MethodControllerOptions, MiddlewareOptions } from '../decorators/types/MethodMetadataTypes';
import { NotAuthorized, BadRequest } from '../errors/MainAppErrror';
import { ParamDescription, ParamOptions, ParamDecoratorType } from '../decorators/types/ParamMetadataTypes';
import { AppErrorHandler, IErrorHandler, ErrorHandlerFunction } from '../errors/types/ErrorHandlerTypes';

export class BaseServer {
    constructor(private options: ServerOptions) { }
    private brokers: IBroker[] = [];

    public addBroker(broker: IBroker) {
        this.brokers.push(broker);
    }

    private get controllersMetadata(): GlobalMetadata {
        return getGlobalMetadata();
    }

    private async executeMiddleware(middleware: AppMiddelware, def: BaseRouteDefinition, action: Action, controller: any): Promise<Action> {
        if ('do' in middleware) {
            const casted = middleware as IMiddleware;
            return casted.do(action, def, controller);
        }
        return (middleware as MiddlewareFunction)(action, def, controller);
    }

    private async executeErrorHandler(handler: AppErrorHandler, error: any, action: Action, def: BaseRouteDefinition, controller: any, broker: IBroker) {
        if ('do' in handler) {
            const casted = handler as IErrorHandler;
            return casted.do(error, action, def, controller, broker);
        }
        return (handler as ErrorHandlerFunction)(error, action, def, controller, broker);
    }

    private async handleError(handlers: AppErrorHandler[], error: any, action: Action, def: BaseRouteDefinition, controllerInstance: any, broker: IBroker): Promise<boolean> {
        for (let i = 0; i < handlers.length; i++) {
            const result = await this.executeErrorHandler(handlers[i], error, action, def, controllerInstance, broker);
            if (result === true) {
                return true;
            }
        }
        return false;
    }

    private async executeRequest(def: BaseRouteDefinition, action: Action, broker: IBroker) {
        const controllerInstance: any = Container.get(def.controllerCtor);
        const methodControllerMetadata: MethodControllerOptions = getHandlerMetadata(def.controllerCtor, def.handlerName);
        try {
            action = await this.handleRequest(def, action, broker, controllerInstance, methodControllerMetadata);
        } catch (err) {
            const errorHandlers: AppErrorHandler[] = this.getErrorHandlers(methodControllerMetadata);
            const handled = await this.handleError(errorHandlers, err, action, def, controllerInstance, broker);
            if (!handled) {
                action.response = action.response || {};
                action.response.statusCode = err.statusCode || 500;
                action.response.is_error = true;
                action.response.error = err;
            }
        }
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

    private getErrorHandlers(methodMetadata: MethodControllerOptions) {
        const result: AppErrorHandler[] = [];
        result.push(...methodMetadata.method.errorHandlers || []);
        result.push(...methodMetadata.controller.errorHandlers || []);
        result.push(...this.options.errorHandlers || []);
        return result;
    }

    private async handleRequest(def: BaseRouteDefinition, action: Action, broker: IBroker, controllerInstance: any, methodControllerMetadata: MethodControllerOptions) {
        await this.checkAuthorization(action, methodControllerMetadata);
        const middlewares = this.getMiddlewares(methodControllerMetadata);
        if (middlewares.before.length) {
            for (let i = 0; i < middlewares.before.length; i++) {
                action = await this.executeMiddleware(middlewares.before[i], def, action, controllerInstance);
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
                action = await this.executeMiddleware(middlewares.after[i], def, action, controllerInstance);
            }
        }
        return action;
    }

    private async buildParams(action: Action,
        metadata: MethodDescription, broker: IBroker): Promise<any[]> {
        return Promise.all(metadata.params.map(async (p) => {
            return this.buildSingleParam(action, p, broker);
        }));
    }

    private async getUser(action: Action): Promise<any> {
        if (!this.options.currentUserChecker) {
            return null;
        }
        return this.options.currentUserChecker(action);
    }

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
     * @param action
     * @param metadata
     * @param broker
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
                    return Container.get(options.name as string);
                case ParamDecoratorType.Broker:
                    return broker;

                case ParamDecoratorType.Header:
                    const headers = action.request.headers;
                    return this.validateParam(headers, options.headerOptions!.validate || false, false, 'headers', metadata.type);
                case ParamDecoratorType.HeaderField:
                    const headerParam = action.request.headers[options.name as string]
                    return this.validateParam(headerParam, options.headerParamOptions!.required || false, false, options.name);

                case ParamDecoratorType.Query:
                    const query = action.request.qs;
                    return this.validateParam(query, options.queryOptions!.required || false, options.queryOptions!.validate || false, 'query', metadata.type);
                case ParamDecoratorType.QueryField:
                    const queryParam = action.request.qs[options.name as string];
                    return this.validateParam(queryParam, options.queryParamOptions!.required || false, false, options.name);

                case ParamDecoratorType.User:
                    const user = await this.getUser(action);
                    const required = options.currentUserOptions!.required || false;
                    if (required && !user) {
                        throw new NotAuthorized("You are not authorized to access this resource");
                    }
                    return user;
            }
        }
    }

    private addRoute(def: BaseRouteDefinition) {
        if (this.options.brokers) {
            this.options.brokers.forEach((broker) => {
                broker.addRoute(def, (action: Action) => {
                    return this.executeRequest(def, action, broker);
                });
            });
        }
    }

    public async start() {
        this.buildRoutes();
        if (this.options.brokers) {
            await Promise.all(this.options.brokers.map(async (x) => {
                await x.start();
            }));
            console.log("SERVER STARTED");
        }
    }
    public buildRoutes() {
        let controllers = this.controllersMetadata.controllers;
        const routes: { method: string, path: string }[] = [];
        const basePath = this.options.basePath || "";
        controllers.forEach((c) => {
            if (this.options.controllers.includes(c.ctor)) {
                const name = c.name;
                let options = c.options;
                options = options || {};
                const cPath = options.path;
                const isJon = options.json;
                const controllerPath = cPath || name;
                const handlers = c.handlers as any;
                Object.keys(handlers).forEach((key) => {
                    const methodName = key;
                    const methodPath = (c.handlers as any)[key].metadata.path;
                    let path = methodPath || methodName;
                    if (methodPath === "") {
                        path = methodPath;
                    }
                    const reqMethod = (c.handlers as any)[key].metadata.method;
                    const routeDefinition: BaseRouteDefinition = {
                        base: basePath,
                        controller: controllerPath,
                        controllerCtor: c.ctor,
                        handler: path,
                        handlerName: methodName,
                        method: reqMethod,
                        consumers: (c.handlers as any)[key].metadata.consumers,
                        json: isJon
                    };
                    this.addRoute(routeDefinition);
                    routes.push({ method: reqMethod.toUpperCase(), path: `${basePath}/${controllerPath}/${path}` })
                });
            }
        });
        console.table(routes);
    }
}
