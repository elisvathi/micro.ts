import { Action } from "../decorators/BaseDecorators";
import { Server as HapiServer, Request as HapiRequest } from 'hapi';
import { Inject, Service } from "../di/DiDecorators";

export abstract class CoreHandler {
}
export interface BaseRouteDefinition {
    base: string;
    controller: string;
    controllerCtor: any;
    handler: string;
    handlerName: string;
    method: string;
}

export type RouteMapper = (def: BaseRouteDefinition) => string;
export type RequestMapper = (...input: any[]) => Action;

export interface BrokerConnection<T> {
    connection: T;
}

export interface IBroker {
    addRoute(def: BaseRouteDefinition, handler: (action: Action)=>any): void | Promise<void>;
    start(): Promise<void>;
}

@Service()
export class HapiBroker implements IBroker{

    constructor(@Inject({ key: 'hapiOptions' }) private options: {address: string, port: string}) {
        this.server = new HapiServer({
            address: options.address, port: options.port
        });
    }

    private server: HapiServer;

    protected routeMaper: RouteMapper = (def: BaseRouteDefinition) => {
        return `${def.base}/${def.controller}/${def.handler}`;
    }

    protected requestMapper: RequestMapper = (r: HapiRequest) => {
        const act: Action = {
            params: r.params,
            path: r.path,
            headers: r.headers,
            method: r.method,
            body: r.payload,
            qs: r.query,
            raw: r,
            connection: r.server
        }
        return act;
    }

    public addRoute(def: BaseRouteDefinition, handler: (action: Action) => any) {
        this.server.route({
            method: def.method,
            path: this.routeMaper(def),
            handler: (r: HapiRequest) => {
                return handler(this.requestMapper(r));
            }
        });
    }

    public async start() {
        await this.server.start();
        console.log(`Server listetening on address ${this.options.address} and port ${this.options.port}`);
    }
}
