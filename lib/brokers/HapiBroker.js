"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hapi_1 = require("hapi");
const AbstractBroker_1 = require("./AbstractBroker");
class HapiBroker extends AbstractBroker_1.AbstractBroker {
    constructor(options) {
        super();
        this.options = options;
        this.routeMapper = (def) => {
            return `/${def.base}/${def.controller}/${def.handler}`;
        };
        this.requestMapper = (r) => {
            const act = {
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
        this.server = new hapi_1.Server({
            address: options.address, port: options.port
        });
    }
    registerRoutes() {
        this.registeredRoutes.forEach(async (value, route) => {
            if (value.length > 0) {
                this.server.route({
                    method: value[0].def.method,
                    path: route,
                    handler: async (r, h) => {
                        const action = this.requestMapper(r);
                        const handler = this.actionToRouteMapper(route, action, value);
                        const result = await handler(action);
                        result.response = result.response || {};
                        const body = result.response.body || result.response.error;
                        let hapiResponse = h.response(body).code(result.response.statusCode || 200);
                        const headers = result.response.headers || {};
                        Object.keys(headers).forEach(h => {
                            hapiResponse = hapiResponse.header(h, headers[h]);
                        });
                        return hapiResponse;
                    }
                });
            }
        });
    }
    async start() {
        this.registerRoutes();
        await this.server.start();
        console.log(`Server listening on address ${this.options.address} and port ${this.options.port}`);
    }
}
exports.HapiBroker = HapiBroker;
