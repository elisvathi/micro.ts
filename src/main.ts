
import { JsonController, Get, Post, Body, Headers, CurrentUser, Delete, Query, UseMiddleware, Action } from "./decorators/BaseDecorators";
import { BaseServer } from "./server/BaseServer";
import { Container } from "./di/BaseContainer";
import { Service } from "./di/DiDecorators";
import { HapiBroker } from "./brokers/HapiBroker";
import { AmqpBroker } from "./brokers/AmqpBroker";
import { BaseRouteDefinition } from "../lib/brokers/IBroker";
import { DefinitionHandlerPair } from "./brokers/AbstractBroker";

@Service()
class UserService {
    private data: any[] = [];

    getData() {
        return this.data;
    }

    setData(headers: any) {
        this.data.push(headers);
    }
}

@JsonController("Voluum")
export class VoluumController {

    constructor(private serv: UserService) {
    }

    @Get()
    @UseMiddleware({
        before: true,
        middleware: (a: Action) => { a.request.qs = { num: Math.random(), value: (Math.random() < 0.5) ? true : false, ...a.request.qs }; return a; }
    })
    @UseMiddleware({
        before: false,
        middleware: (a: Action) => {
            a.response = a.response || {};
            a.response.body = { ok: true, result: a.response.body };
            return a;
        }
    })
    public async trafficSources(@CurrentUser() user: any, @Query() query: any, @Headers() headers: any) {
        this.serv.setData(query);
        return this.serv.getData();
    }

    @Get()
    public async trackerView() {
        return {};
    }

    @Post({ path: "clear" })
    public async removeData(@Body({ validate: true, required: false }) data: UserService) {
        console.log("CALLED", JSON.parse(data.toString()));
        return { "Done": true };
    }

    @Delete({ path: "clear-all" })
    public async removeAllData() {

    }
}

async function main() {
    Container.set("hapiOptions", { address: '0.0.0.0', port: 8080 });
    Container.set("amqpOptions", { url: "amqp://localhost" });
    const hapi = Container.get(HapiBroker);
    const amqp = Container.get(AmqpBroker);
    amqp.setRouteMapper((def: BaseRouteDefinition)=>{
        return `ms.Tracker.${def.controller}`
    });
    amqp.setActionToHandlerMapper((route: string, action: Action, pairs: DefinitionHandlerPair[])=>{
        const body = action.request.body;
        const method = body.method;
        let filtered = pairs.find(x=>x.def.handlerName === method);
        if(!filtered){
            filtered = pairs[0];
        }
        action.request.method = filtered.def.method;
        return filtered.handler;
    });
    const server = new BaseServer({
        controllers: [VoluumController],
        brokers: [hapi, amqp],
        logRequests: true,
        basePath: 'api',
        dev: true,
        currentUserChecker: (a: Action) => { return a.request.headers }
    });
    await server.start();
}

main().catch(console.log);
