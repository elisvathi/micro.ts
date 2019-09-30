import { IBroker, BaseRouteDefinition } from "../brokers/IBroker";
import { GlobalMetadata, getGlobalMetadata, MethodDescription, ControllerMetadata, ControllerHanlders, ParamDescription } from "../decorators/ControllersMetadata";
import { Container } from "../di/BaseContainer";
import { Action, ParamOptions, ParamDecoratorType, ContainerInject } from "../decorators/BaseDecorators";

export interface ServerOptions {
    basePath?: string;
    controllers: any[];
    brokers?: IBroker[];
    currentUserChecker?: (action: Action) => any;
    authorizationChecker?: (action: Action) => boolean | Promise<boolean>;
}
export class BaseServer {
    constructor(private options: ServerOptions) { }
    private brokers: IBroker[] = [];

    public addBroker(broker: IBroker) {
        this.brokers.push(broker);
    }

    private get controllersMetadata(): GlobalMetadata {
        return getGlobalMetadata();
    }

    private async handleRequest(def: BaseRouteDefinition, action: Action) {
        const controllerInstance: any = Container.get(def.controllerCtor);
        const method = controllerInstance[def.handlerName];
        const methodMetadata: MethodDescription = this.getSingleMethodMetadata(def.controllerCtor, def.handlerName);
        const args = await this.buildParams(action, methodMetadata);
        console.log("CALLING ", def);
        return method(...args);
    }

    private async buildParams(action: Action,
        metadata: MethodDescription): Promise<any[]> {
        return Promise.all(metadata.params.map(async (p) => {
            return this.buildSingleParam(action, p);
        }));
    }

    private async getUser(action: Action): Promise<any> {
        if (!this.options.currentUserChecker) {
            return null;
        }
        return this.options.currentUserChecker(action);
    }

    private async buildSingleParam(action: Action,
        metadata: ParamDescription): Promise<any> {
        if (!metadata.options) {
            return action.body || action.qs || {};
        } else {
            const options: ParamOptions = metadata.options as ParamOptions;
            switch (options.decoratorType) {

                case ParamDecoratorType.Body:
                    return action.body;
                case ParamDecoratorType.BodyField:
                    return action.body[options.name as string]

                case ParamDecoratorType.Params:
                    return action.params;
                case ParamDecoratorType.ParamField:
                    return action.params[options.name as string]

                case ParamDecoratorType.Method:
                    return action.method;
                case ParamDecoratorType.Connection:
                    return action.connection;
                case ParamDecoratorType.Request:
                    return action;
                case ParamDecoratorType.RawRequest:
                    return action.raw;
                case ParamDecoratorType.ContainerInject:
                    return Container.get(options.name as string);

                case ParamDecoratorType.Header:
                    return action.headers;
                case ParamDecoratorType.HeaderField:
                    return action.headers[options.name as string]

                case ParamDecoratorType.Query:
                    return action.qs;
                case ParamDecoratorType.QueryField:
                    return action.qs[options.name as string];

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
        const handlers: ControllerHanlders = (ctorMetadata as ControllerMetadata).handlers || {};
        return handlers[methodName];
    }

    private async addRoute(def: BaseRouteDefinition) {
        if(this.options.brokers){
            this.options.brokers.forEach(async (broker)=>{
                await broker.addRoute(def, (action: Action)=>{
                    return this.handleRequest(def, action);
                });
            });
        }
    }
    public async start(){
        this.buildRoutes();
        if(this.options.brokers){
            await Promise.all(this.options.brokers.map(async (x)=>{
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
                const controllerPath = cPath || name;
                const handlers = c.handlers as any;
                Object.keys(handlers).forEach(async (key) => {
                    const methodName = key;
                    const methodPath = (c.handlers as any)[key].metadata.path;
                    const path = methodPath || methodName;
                    const reqMethod = (c.handlers as any)[key].metadata.method;
                    const routeDefinition: BaseRouteDefinition = {base: basePath,
                                                                  controller: controllerPath,
                                                                  controllerCtor: c.ctor,
                                                                  handler: path,
                                                                  handlerName: methodName,
                                                                  method: reqMethod};
                    await this.addRoute(routeDefinition);
                    routes.push({ method: reqMethod.toUpperCase(), path: `${basePath}/${controllerPath}/${path}` })
                });
            }
        });
        console.table(routes);
    }
}
