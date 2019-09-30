import { IBroker, BaseRouteDefinition, RouteMapper, RequestMapper } from "./IBroker";
import { Action } from "../decorators/BaseDecorators";
import { Connection, Channel, connect, Message, ConsumeMessage } from "amqplib";
import { Inject } from "../di/DiDecorators";

export class AmqpBroker implements IBroker {
    private connection!: Connection;
    private channel!: Channel;
    private routes: {def: BaseRouteDefinition, handler: (action: Action)=>any}[] = [];
    constructor(@Inject({ key: 'amqpOptions' }) private options: { url: string }) {
    }

    public async init() {
    }

    protected requestMapper: RequestMapper = (r: Message, queue: string, method: string) => {
        const act: Action = {
            params: {},
            path: queue,
            headers: r.properties.headers,
            method: method,
            body: r.content,
            qs: {},
            raw: r,
            connection: this.connection
        }
        return act;
    }

    protected routeMaper: RouteMapper = (def: BaseRouteDefinition) => {
        return `${def.base}.${def.controller}.${def.handler}`.replace('/', '.');
    }
    private async registerRoutes(){
        return Promise.all(this.routes.map(async (route)=>{
            const queue = this.routeMaper(route.def);
            await this.channel.assertQueue(queue, {autoDelete: true});
            await this.channel.consume(queue, async (message: ConsumeMessage | null) => {
                if (message) {
                    const result = await route.handler(this.requestMapper(message, queue, route.def.method));
                    console.log({properties: message.properties, result});
                    if (result && message.properties.replyTo && message.properties.correlationId) {
                        console.log("HAS REPLY TO");
                        await this.rpcReply(result, message.properties.replyTo, message.properties.correlationId);
                    }
                    await this.channel.ack(message);
                }
            });
        }));
    }

    private async rpcReply(data: any, replyToQueue: string, correlationId: string) {
        await this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(data)), { correlationId });
    }
    public async addRoute(def: BaseRouteDefinition, handler: (action: Action) => any) {
        this.routes.push({def, handler});
    }

    public async start() {
        this.connection = await connect(this.options.url);
        this.channel = await this.connection.createChannel();
        await this.registerRoutes();
        this.routes = [];
        console.log(`AMQP Connected on path ${this.options.url}`);
    }
}
