import { Server as HapiServer, Request as HapiRequest } from 'hapi';
import { AbstractBroker, DefinitionHandlerPair } from "./AbstractBroker";
import { RouteMapper, BaseRouteDefinition, RequestMapper } from "./IBroker";
import { Action } from "../decorators/BaseDecorators";
import { Inject } from '../di/DiDecorators';

export class HapiBroker2 extends AbstractBroker {

    private server: HapiServer;
    constructor(
        @Inject("hapiOptions")
        private options: {
            address: string;
            port: string;
        }) {
        super();
        this.server = new HapiServer({
            address: options.address, port: options.port
        });
    }

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

    private registerRoutes() {
        this.registeredRoutes.forEach(async (value: DefinitionHandlerPair[], route: string) => {
            if (value.length > 0) {
                this.server.route({
                    method: value[0].def.method,
                    path: route,
                    handler: async (r: HapiRequest) => {
                        const action = this.requestMapper(r);
                        const handler = this.actionToRouteMapper(route, action, value);
                        const result: Action = await handler(action);
                        result.response = result.response || {};
                        return result.response.body;
                    }
                });
            }
        });
    }
    public async start(): Promise<void> {
        this.registerRoutes();
        await this.server.start();
        console.log(`Server listening on address ${this.options.address} and port ${this.options.port}`);
    }

}
