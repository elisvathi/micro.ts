import chalk from 'chalk';
import { ServerOptions } from './types/ServerOptions';
import { IBroker } from '../brokers/IBroker';
import { GlobalMetadata, ControllerHandlers, ControllerMetadata } from '../decorators/types/ControllerMetadataTypes';
import { getGlobalMetadata } from '../decorators/GlobalMetadata';
import { MiddlewareFunction, IMiddleware } from '../middlewares/IMiddleware';
import { BaseRouteDefinition, Action } from './types/BaseTypes';
import { Container } from '../di/BaseContainer';
import { MethodDescription } from '../decorators/types/MethodMetadataTypes';
import { NotAuthorized } from '../errors/MainAppErrror';
import { ParamDescription, ParamOptions, ParamDecoratorType } from '../decorators/types/ParamMetadataTypes';

export class BaseServer {
    constructor(private options: ServerOptions) { }
    private brokers: IBroker[] = [];

    public addBroker(broker: IBroker) {
        this.brokers.push(broker);
    }

    private get controllersMetadata(): GlobalMetadata {
        return getGlobalMetadata();
    }
    private async executeMiddleware(middleware: MiddlewareFunction | IMiddleware, def: BaseRouteDefinition, action: Action, controller: any): Promise<Action> {
        if ('do' in middleware) {
            const casted = middleware as IMiddleware;
            return casted.do(action, def, controller);
        }
        return (middleware as MiddlewareFunction)(action, def, controller);
    }

    private async executeRequest(def: BaseRouteDefinition, action: Action, broker: IBroker){
        try {
            action = await this.handleRequest(def, action, broker);
        }catch(err){
            action.response = action.response || {};
            action.response.statusCode = err.statusCode || 500;
            action.response.is_error = true;
            action.response.error = err;
        }
        return action;
    }

    private async handleRequest(def: BaseRouteDefinition, action: Action, broker: IBroker) {
        const controllerInstance: any = Container.get(def.controllerCtor);
        const methodMetadata: MethodDescription = this.getSingleMethodMetadata(def.controllerCtor, def.handlerName);
        if (this.options.authorizationChecker && methodMetadata.authorize) {
            const authorized = await this.options.authorizationChecker(action, methodMetadata.authorization || {});
            if (!authorized) {
               throw new NotAuthorized("You are not authorized to make this request");
            }
        }
        const middlewares: { before: any[], after: any[] } = { before: [], after: [] };
        if (methodMetadata.middlewares && methodMetadata.middlewares.length) {
            methodMetadata.middlewares.forEach(x => {
                if (x.before) {
                    middlewares.before.push(x.middleware);
                } else {
                    middlewares.after.push(x.middleware);
                }
            });
        }
        if (middlewares.before.length) {
            for (let i = 0; i < middlewares.before.length; i++) {
                action = await this.executeMiddleware(middlewares.before[i], def, action, controllerInstance);
            }
        }
        const args = await this.buildParams(action, methodMetadata, broker);
        if (this.options.logRequests) {
            console.log(chalk.greenBright(`[${broker.constructor.name}]`), chalk.blueBright(`[${def.method.toUpperCase()}]`), chalk.green(`[${def.controller}]`), chalk.yellow(`[${def.handlerName}]`), `${action.request.path}`);
        }
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
                    return action.request.body;
                case ParamDecoratorType.BodyField:
                    return action.request.body[options.name as string]

                case ParamDecoratorType.Params:
                    return action.request.params;
                case ParamDecoratorType.ParamField:
                    return action.request.params[options.name as string]

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
                    return action.request.headers;
                case ParamDecoratorType.HeaderField:
                    return action.request.headers[options.name as string]

                case ParamDecoratorType.Query:
                    return action.request.qs;
                case ParamDecoratorType.QueryField:
                    return action.request.qs[options.name as string];

                case ParamDecoratorType.User:
                    const user = await this.getUser(action);
                    return user;

            }
        }
    }

    private getSingleMethodMetadata(ctor: any, methodName: string): MethodDescription {
        let ctorMetadata = this.controllersMetadata.controllers.get(ctor);
        if (!ctorMetadata) {
            return { name: methodName, params: [] };
        }
        const handlers: ControllerHandlers = (ctorMetadata as ControllerMetadata).handlers || {};
        return handlers[methodName];
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
                    const path = methodPath || methodName;
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
