import { Server as HapiServer, Request as HapiRequest } from 'hapi';
import { Inject, Service } from "../di/DiDecorators";
import { IBroker, RouteMapper, BaseRouteDefinition, RequestMapper } from "./IBroker";
import { Action } from '../decorators/BaseDecorators';

@Service()
export class HapiBroker implements IBroker {

    setRequestMapper(requestMapper: RequestMapper): void {
        this.requestMapper = requestMapper;
    }
    setRouteMapper(setRouteMapper: RouteMapper): void {
        this.routeMapper = this.routeMapper;
    }
    constructor(
        @Inject("hapiOptions")
        private options: {
            address: string;
            port: string;
        }) {
        this.server = new HapiServer({
            address: options.address, port: options.port
        });
    }
    private server: HapiServer;
    protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
        return `/${def.base}/${def.controller}/${def.handler}`;
    };
    protected requestMapper: RequestMapper = (r: HapiRequest) => {
        const act: Action = {
            request: {
                params: r.params,
                path: r.path,
                headers: r.headers,
                method: r.method,
                body: r.payload,
                qs: r.query,
                raw: r,
            },
            connection: r.server
        };
        return act;
    };

    /**
     * Registers route immediately on hapi Server object
     * @param def
     * @param handler
     */
    public addRoute(def: BaseRouteDefinition, handler: (action: Action) => Action) {
        this.server.route({
            method: def.method,
            path: this.routeMapper(def),
            handler: async (r: HapiRequest) => {
                const result: Action = await handler(this.requestMapper(r));
                result.response = result.response || {};
                return result.response.body;
            }
        });
    }
    public async start() {
        await this.server.start();
        console.log(`Server listening on address ${this.options.address} and port ${this.options.port}`);
    }
}
