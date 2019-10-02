import { Service } from "./di/DiDecorators";
import { JsonController, ControllerAuthorize, BeforeMiddlewares } from "./decorators/ControllerDecorators";
import { Get, Post, Delete } from "./decorators/RestDecorators";
import { UseMiddlewares, AllowAnonymous } from "./decorators/MethodDecorators";
import { Action, BaseRouteDefinition } from "./server/types/BaseTypes";
import { CurrentUser, Query, Headers, Body, Param, QueryParam } from "./decorators/ParameterDecorators";
import { Container } from "./di/BaseContainer";
import { HapiBroker } from "./brokers/HapiBroker";
import { AmqpBroker } from "./brokers/AmqpBroker";
import { DefinitionHandlerPair } from "./brokers/AbstractBroker";
import { BaseServer } from "./server/BaseServer";
import { AuthorizeOptions } from "./decorators/types/MethodMetadataTypes";
import { IMiddleware } from "./middlewares/IMiddleware";
import { IBroker } from "./brokers/IBroker";
import { NotFound } from "./errors/MainAppErrror";
import { Optional, Required, DateString, MinLength } from "joi-typescript-validator";

class User {
    @Required()
    @MinLength(3)
    public name!: string;
}

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
@JsonController("Thrive")
export class Thrive {

    constructor() { }
    @Get({ consumers: 20 })
    getTrafficSources() { }
}

function beforeMiddleWare(a: Action) {
    a.request.qs = { num: Math.random(), value: (Math.random() < 0.5) ? true : false, ...a.request.qs }; return a;
}

@Service()
class TrackerMiddleware implements IMiddleware {
    constructor() { }
    num: number = 0;
    do(action: Action, def?: BaseRouteDefinition | undefined, controller?: VoluumController, broker?: IBroker): Action | Promise<Action> {
        controller!.login(this.num);
        this.num++;
        return action;
    }
}

@JsonController("Voluum")
@ControllerAuthorize()
@BeforeMiddlewares([Container.get(TrackerMiddleware)])
export class VoluumController {
    constructor(private serv: UserService) {
    }

    public login(num: number) {
        console.log("Called login " + num);
    };

    @Get()
    @UseMiddlewares([{
        before: true,
        middleware: beforeMiddleWare
    }])
    @AllowAnonymous()
    public async trafficSources(@CurrentUser() _user: any, @Query() query: any, @Headers() _headers: any) {
        this.serv.setData(query);
        return this.serv.getData();
    }

    @Get({ consumers: 2 })
    public async trackerView() {
        throw new NotFound();
    }

    @Post({ path: "clear" })
    @AllowAnonymous()
    public async removeData(@Query({required: true, validate: true}) data: User) {
        return {data};
    }

    @Delete({ path: "clear-all" })
    public async removeAllData() {

    }
}

async function main() {
    const HapiConfig = { address: '0.0.0.0', port: 8080 };
    const AmqpConfig = { url: 'amqp://localhost' };
    const hapi = new HapiBroker(HapiConfig);
    const amqp = new AmqpBroker(AmqpConfig)
    amqp.setRouteMapper((def: BaseRouteDefinition) => {
        return `ms.Tracker.${def.controller}`
    });
    amqp.setActionToHandlerMapper((_route: string, action: Action, pairs: DefinitionHandlerPair[]) => {
        const body = action.request.body;
        const method = body.method;
        let filtered = pairs.find(x => x.def.handlerName === method);
        if (!filtered) {
            filtered = pairs[0];
        }
        action.request.method = filtered.def.method;
        return filtered.handler;
    });

    const server = new BaseServer({
        controllers: [VoluumController, Thrive],
        brokers: [hapi, amqp],
        logRequests: true,
        basePath: 'api',
        dev: true,
        afterMiddlewares: [(action: Action) => {
            action.response = action.response || {};
            const currentBody = action.response.body;
            action.response.body = { ok: true, result: currentBody };
            return action;
        }],
        currentUserChecker: (a: Action) => { return {}; },
        authorizationChecker: (_a: Action, _options?: AuthorizeOptions) => { return false; }
    });
    await server.start();
}

main().catch(console.log);
