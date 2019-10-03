"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractBroker_1 = require("./AbstractBroker");
const amqplib_1 = require("amqplib");
class AmqpBroker extends AbstractBroker_1.AbstractBroker {
    constructor(options) {
        super();
        this.options = options;
        this.requestMapper = (r, queue, json) => {
            const payloadString = r.content.toString();
            let payload;
            if (json) {
                payload = JSON.parse(payloadString);
            }
            else {
                payload = payloadString;
            }
            const act = {
                request: {
                    params: {},
                    path: queue,
                    headers: r.properties.headers,
                    // method: def.method,
                    body: payload,
                    qs: {},
                    raw: r
                },
                connection: this.connection
            };
            return act;
        };
        this.routeMapper = (def) => {
            return `${def.base}.${def.controller}.${def.handler}`.replace('/', '.');
        };
    }
    async registerRoutes() {
        this.registeredRoutes.forEach(async (value, route) => {
            let json = false;
            let totalConsumers = 0;
            value.forEach(v => {
                const consumers = v.def.consumers || 1;
                if (v.def.json) {
                    json = true;
                }
                totalConsumers += consumers;
            });
            if (totalConsumers > 0) {
                await this.channel.assertQueue(route, { autoDelete: true });
                for (let i = 0; i < totalConsumers; i++) {
                    await this.channel.consume(route, async (message) => {
                        if (message) {
                            const mapped = this.requestMapper(message, route, json);
                            const handler = this.actionToRouteMapper(route, mapped, value);
                            const result = await handler(mapped);
                            if (result && message.properties.replyTo && message.properties.correlationId) {
                                await this.rpcReply(result, message.properties.replyTo, message.properties.correlationId);
                            }
                            await this.channel.ack(message);
                        }
                    });
                }
            }
        });
    }
    async rpcReply(data, replyToQueue, correlationId) {
        const response = data.response || {};
        const body = response.body || response.error;
        const headers = response.headers || {};
        if (response.is_error) {
            headers.error = true;
        }
        headers.statusCode = response.statusCode;
        await this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(body)), { correlationId, headers });
    }
    async start() {
        this.connection = await amqplib_1.connect(this.options.url);
        this.channel = await this.connection.createChannel();
        await this.registerRoutes();
        console.log(`AMQP Connected on path ${this.options.url}`);
    }
}
exports.AmqpBroker = AmqpBroker;
