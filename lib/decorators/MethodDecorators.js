"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDecorators_1 = require("./BaseDecorators");
function Authorize(options) {
    return (target, propertyKey, descriptor) => {
        BaseDecorators_1.attachHandlerAuthorization(target, propertyKey, descriptor, options);
    };
}
exports.Authorize = Authorize;
function AllowAnonymous() {
    return (target, propertyKey, descriptor) => {
        BaseDecorators_1.attachHandlerAuthorization(target, propertyKey, descriptor, undefined, false);
    };
}
exports.AllowAnonymous = AllowAnonymous;
/**
 * Registers middlewares for the handler it decorates
 * @param options
 */
function UseMiddlewares(options) {
    return (target, propertyKey, descriptor) => {
        BaseDecorators_1.attachHandlerMiddleware(target, propertyKey, descriptor, options);
    };
}
exports.UseMiddlewares = UseMiddlewares;
/**
 * Register error handler for the handler it decorates
 * @param options
 */
function UseErrorHandler(options) {
    return (target, propertyKey, descriptor) => {
        BaseDecorators_1.attachHandlerErrorHandler(target, propertyKey, descriptor, options);
    };
}
exports.UseErrorHandler = UseErrorHandler;
