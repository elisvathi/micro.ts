"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDecorators_1 = require("./BaseDecorators");
function Controller(options) {
    return (target) => {
        options = options || {};
        BaseDecorators_1.registerControllerMetadata(target, options);
    };
}
exports.Controller = Controller;
function JsonController(path, options) {
    return (target) => {
        options = options || {};
        options.json = true;
        options.path = path;
        BaseDecorators_1.registerControllerMetadata(target, options);
    };
}
exports.JsonController = JsonController;
function BeforeMiddlewares(options) {
    return (target) => {
        BaseDecorators_1.attachControllerMiddleware(target, options, true);
    };
}
exports.BeforeMiddlewares = BeforeMiddlewares;
function AfterMiddlewares(options) {
    return (target) => {
        BaseDecorators_1.attachControllerMiddleware(target, options, false);
    };
}
exports.AfterMiddlewares = AfterMiddlewares;
function ControllerAuthorize(options) {
    return (target) => {
        BaseDecorators_1.attachControllerAuthorization(target, options);
    };
}
exports.ControllerAuthorize = ControllerAuthorize;
function ControllerErrorHandlers(options) {
    return (target) => {
        BaseDecorators_1.attachControllerErrorHandlers(target, options);
    };
}
exports.ControllerErrorHandlers = ControllerErrorHandlers;
//# sourceMappingURL=ControllerDecorators.js.map