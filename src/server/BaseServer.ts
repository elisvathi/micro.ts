import { IBroker, BaseRouteDefinition } from "../brokers/IBroker";
import { GlobalMetadata, getGlobalMetadata } from "../decorators/ControllersMetadata";
import { Container } from "../di/BaseContainer";

export interface ServerOptions {
    basePath?: string;
    controllers: any[];
    brokers?: any[];
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

    private handleRequest(controller: any, method: any, args: any) {
        const controllerInstance: any = Container.get(controller);
        return controllerInstance[method](...args);
    }
    private addRoute(def: BaseRouteDefinition){
    }

    public buildRoutes() {
        let controllers = this.controllersMetadata.controllers;
        const routes: { method: string, path: string }[] = [];
        const basePath = this.options.basePath || "";
        controllers.forEach(c => {
            if (this.options.controllers.includes(c.ctor)) {
                const name = c.name;
                let options = c.options;
                options = options || {};
                const cPath = options.path;
                const controllerPath = cPath || name;
                const handlers = c.handlers as any;
                Object.keys(handlers).forEach(key => {
                    const methodName = key;
                    const methodPath = (c.handlers as any)[key].metadata.path;
                    const path = methodPath || methodName;
                    const reqMethod = (c.handlers as any)[key].metadata.method;
                    routes.push({ method: reqMethod.toUpperCase(), path: `${basePath}/${controllerPath}/${path}` })
                });
            }
        });
        console.table(routes);
    }
}
