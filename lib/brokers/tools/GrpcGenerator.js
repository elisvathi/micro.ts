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
Object.defineProperty(exports, "__esModule", { value: true });
const DiDecorators_1 = require("../../di/DiDecorators");
const GlobalMetadata_1 = require("../../decorators/GlobalMetadata");
function isPrimitive(type) {
    const prims = ['String', 'Number', 'Boolean'];
    return prims.includes(type);
}
let GrpcGenerator = class GrpcGenerator {
    constructor() {
        const dir = __dirname;
    }
    generateString() {
        const metadata = GlobalMetadata_1.getGlobalMetadata();
        let str = "";
        metadata.controllers.forEach(x => {
            str += `service ${x.name} {\n\n`;
            const handlers = x.handlers || {};
            Object.keys(handlers).forEach((key) => {
                // const metadata = handlers[key].metadata || {};
                const params = handlers[key].params;
                const names = params.map(x => x.type.name).map(x => {
                    if (isPrimitive(x)) {
                        return x.toLowerCase();
                    }
                    ;
                    return x;
                }).join(" ");
                str += `    rpc ${key} (${names}) returns () {}\n\n`;
            });
            str += `}\n\n`;
        });
        return str;
    }
};
GrpcGenerator = __decorate([
    DiDecorators_1.Service(),
    __metadata("design:paramtypes", [])
], GrpcGenerator);
exports.GrpcGenerator = GrpcGenerator;
