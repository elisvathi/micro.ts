"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DiDecorators_1 = require("./di/DiDecorators");
const ControllerDecorators_1 = require("./decorators/ControllerDecorators");
const RestDecorators_1 = require("./decorators/RestDecorators");
const MethodDecorators_1 = require("./decorators/MethodDecorators");
const ParameterDecorators_1 = require("./decorators/ParameterDecorators");
const BaseContainer_1 = require("./di/BaseContainer");
const HapiBroker_1 = require("./brokers/HapiBroker");
const AmqpBroker_1 = require("./brokers/AmqpBroker");
const BaseServer_1 = require("./server/BaseServer");
const MainAppErrror_1 = require("./errors/MainAppErrror");
const joi_typescript_validator_1 = require("joi-typescript-validator");
const joi_1 = __importDefault(require("joi"));
class User {
}
__decorate([
    joi_typescript_validator_1.Required(),
    joi_typescript_validator_1.MinLength(3),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
let UserService = class UserService {
    constructor() {
        this.data = [];
    }
    getData() {
        return this.data;
    }
    setData(headers) {
        this.data.push(headers);
    }
};
UserService = __decorate([
    DiDecorators_1.Service()
], UserService);
let Thrive = class Thrive {
    constructor() { }
    getTrafficSources() { }
};
__decorate([
    RestDecorators_1.Get({ consumers: 20 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Thrive.prototype, "getTrafficSources", null);
Thrive = __decorate([
    ControllerDecorators_1.JsonController("Thrive"),
    __metadata("design:paramtypes", [])
], Thrive);
exports.Thrive = Thrive;
function beforeMiddleWare(a) {
    a.request.qs = { num: Math.random(), value: (Math.random() < 0.5) ? true : false, ...a.request.qs };
    return a;
}
let TrackerMiddleware = class TrackerMiddleware {
    constructor() {
        this.num = 0;
    }
    do(action, def, controller, broker) {
        controller.login(this.num);
        this.num++;
        return action;
    }
};
TrackerMiddleware = __decorate([
    DiDecorators_1.Service(),
    __metadata("design:paramtypes", [])
], TrackerMiddleware);
let VoluumController = class VoluumController {
    constructor(serv) {
        this.serv = serv;
    }
    login(num) {
        console.log("Called login " + num);
    }
    ;
    async trafficSources(_user, query, _headers) {
        this.serv.setData(query);
        return this.serv.getData();
    }
    async trackerView() {
        throw new MainAppErrror_1.NotFound();
    }
    async removeData(data) {
        return { data };
    }
    async removeAllData() {
    }
};
__decorate([
    RestDecorators_1.Get(),
    MethodDecorators_1.UseMiddlewares([{
            before: true,
            middleware: beforeMiddleWare
        }]),
    MethodDecorators_1.AllowAnonymous(),
    __param(0, ParameterDecorators_1.CurrentUser()), __param(1, ParameterDecorators_1.Query()), __param(2, ParameterDecorators_1.Headers()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], VoluumController.prototype, "trafficSources", null);
__decorate([
    RestDecorators_1.Get({ consumers: 2 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoluumController.prototype, "trackerView", null);
__decorate([
    RestDecorators_1.Post({ path: "clear" }),
    MethodDecorators_1.AllowAnonymous(),
    __param(0, ParameterDecorators_1.Query({ required: true, validate: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User]),
    __metadata("design:returntype", Promise)
], VoluumController.prototype, "removeData", null);
__decorate([
    RestDecorators_1.Delete({ path: "clear-all" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoluumController.prototype, "removeAllData", null);
VoluumController = __decorate([
    ControllerDecorators_1.JsonController("Voluum"),
    ControllerDecorators_1.ControllerAuthorize(),
    ControllerDecorators_1.BeforeMiddlewares([BaseContainer_1.Container.get(TrackerMiddleware)]),
    __metadata("design:paramtypes", [UserService])
], VoluumController);
exports.VoluumController = VoluumController;
async function main() {
    const HapiConfig = { address: '0.0.0.0', port: 8080 };
    const AmqpConfig = { url: 'amqp://localhost' };
    const hapi = new HapiBroker_1.HapiBroker(HapiConfig);
    const amqp = new AmqpBroker_1.AmqpBroker(AmqpConfig);
    amqp.setRouteMapper((def) => {
        return `ms.Tracker.${def.controller}`;
    });
    amqp.setActionToHandlerMapper((_route, action, pairs) => {
        const body = action.request.body;
        const method = body.method;
        let filtered = pairs.find(x => x.def.handlerName === method);
        if (!filtered) {
            filtered = pairs[0];
        }
        action.request.method = filtered.def.method;
        return filtered.handler;
    });
    const server = new BaseServer_1.BaseServer({
        controllers: [VoluumController, Thrive],
        brokers: [hapi, amqp],
        logRequests: true,
        basePath: 'api',
        dev: true,
        validateFunction: (value, type) => {
            const schema = joi_typescript_validator_1.getSchema(type);
            return joi_1.default.validate(value, schema);
        },
        afterMiddlewares: [(action) => {
                action.response = action.response || {};
                const currentBody = action.response.body;
                action.response.body = { ok: true, result: currentBody };
                return action;
            }],
        currentUserChecker: (a) => { return {}; },
        authorizationChecker: (_a, _options) => { return false; }
    });
    await server.start();
}
main().catch(console.log);
//# sourceMappingURL=main.js.map