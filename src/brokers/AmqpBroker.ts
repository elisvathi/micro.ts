import { IBroker, BaseRouteDefinition, RouteMapper, RequestMapper } from "./IBroker";
import { Connection, Channel, connect, Message, ConsumeMessage } from "amqplib";
import { Inject } from "../di/DiDecorators";
import { Action } from "../../lib/decorators/BaseDecorators";

export class AmqpBroker implements IBroker {

    setRequestMapper(requestMapper: RequestMapper): void {
        this.requestMapper = requestMapper;
    }

    setRouteMapper(setRouteMapper: RouteMapper): void {
        this.routeMapper = this.routeMapper;
    }

    private connection!: Connection;
    private channel!: Channel;
    private routes: { def: BaseRouteDefinition, handler: (action: Action) => Action }[] = [];
    constructor(@Inject("amqpOptions") private options: { url: string }) {
    }

    public async init() {
    }

    protected requestMapper: RequestMapper = (r: Message, queue: string, method: string) => {
        const act: Action = {
            request: {
                params: {},
                path: queue,
                headers: r.properties.headers,
                method: method,
                body: r.content,
                qs: {},
                raw: r
            },
            connection: this.connection
        }
        return act;
    }

    protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
        return `ms.Tracker.${def.controller}.${def.handler}`.replace('/', '.');
    }
    private async registerRoutes() {
        return Promise.all(this.routes.map(async (route) => {
            const queue = this.routeMapper(route.def);
            await this.channel.assertQueue(queue, { autoDelete: true });
            await this.channel.consume(queue, async (message: ConsumeMessage | null) => {
                if (message) {
                    const result = await route.handler(this.requestMapper(message, queue, route.def.method));
                    if (result && message.properties.replyTo && message.properties.correlationId) {
                        await this.rpcReply(result, message.properties.replyTo, message.properties.correlationId);
                    }
                    await this.channel.ack(message);
                }
            });
        }));
    }

    private async rpcReply(data: Action, replyToQueue: string, correlationId: string) {
        const response = data.response || {};
        const body = response.body;
        const headers = response.headers;
        await this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(body)), { correlationId, headers });
    }

    public addRoute(def: BaseRouteDefinition, handler: (action: Action) => any) {
        this.routes.push({ def, handler });
    }

    public async start() {
        this.connection = await connect(this.options.url);
        this.channel = await this.connection.createChannel();
        await this.registerRoutes();
        this.routes = [];
        console.log(`AMQP Connected on path ${this.options.url}`);
    }
}
