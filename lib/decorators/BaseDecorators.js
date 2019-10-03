"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GlobalMetadata_1 = require("./GlobalMetadata");
const DiDecorators_1 = require("../di/DiDecorators");
function registerHandlerMetadata(target, propertyKey, _descriptor, options) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    let controller = metadata.methods.get(target);
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    controller[propertyKey].name = propertyKey;
    controller[propertyKey].metadata = options;
    controller[propertyKey].params = [];
    const existingParams = metadata.parameters.get(target);
    if (existingParams && existingParams[propertyKey]) {
        controller[propertyKey].params = existingParams[propertyKey];
    }
    else {
        const paramtypes = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
        if (paramtypes && paramtypes.length) {
            controller[propertyKey].params.push(...paramtypes.map(x => { return { type: x }; }));
        }
    }
    metadata.parameters.delete(target);
    metadata.methods.set(target, controller);
}
exports.registerHandlerMetadata = registerHandlerMetadata;
function registerParamMetadata(target, propertyKey, index, options) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    let controller = metadata.parameters.get(target);
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || [];
    const paramtypes = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
    if (paramtypes && paramtypes.length > 0 && controller[propertyKey].length === 0) {
        controller[propertyKey].push(...paramtypes.map(x => { return { type: x }; }));
    }
    controller[propertyKey][index].options = options;
    metadata.parameters.set(target, controller);
}
exports.registerParamMetadata = registerParamMetadata;
function attachHandlerAuthorization(target, propertyKey, _descriptor, options, active = true) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    let controller = metadata.methods.get(target);
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.authorize = active;
    handlerObject.authorization = handlerObject.authorization || [];
    handlerObject.authorization = options;
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}
exports.attachHandlerAuthorization = attachHandlerAuthorization;
function attachHandlerMiddleware(target, propertyKey, _descriptor, options) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    let controller = metadata.methods.get(target);
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.middlewares = handlerObject.middlewares || [];
    handlerObject.middlewares.push(...options);
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}
exports.attachHandlerMiddleware = attachHandlerMiddleware;
function attachHandlerErrorHandler(target, propertyKey, _descriptor, options) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    let controller = metadata.methods.get(target);
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.errorHandlers = handlerObject.errorHandlers || [];
    handlerObject.errorHandlers.push(...options);
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}
exports.attachHandlerErrorHandler = attachHandlerErrorHandler;
function registerControllerMetadata(target, options) {
    const metadata = GlobalMetadata_1.getGlobalMetadata();
    metadata.controllers = metadata.controllers || new Map();
    const name = target.name;
    // let found = metadata.controllers.find(x => x.ctor === target);
    let found = metadata.controllers.get(target);
    let isFound = !!found;
    const paramtypes = Reflect.getOwnMetadata('design:paramtypes', target);
    found = found || { name, ctor: target };
    found.constructorParams = [];
    if (paramtypes && paramtypes.length) {
        found.constructorParams.push(...paramtypes.map(x => { return { type: x }; }));
    }
    found.options = found.options || {};
    found.options = { ...found.options, ...(options || {}) };
    if (options && options.errorHandlers) {
        const currentErrorHandlers = found.options.errorHandlers || [];
        options.errorHandlers = [...currentErrorHandlers, ...options.errorHandlers];
    }
    if (options && options.middlewares) {
        const currentMiddlewares = found.options.middlewares || [];
        options.middlewares = [...currentMiddlewares, ...options.middlewares];
    }
    found.handlers = found.handlers || metadata.methods.get(target.prototype);
    metadata.methods.delete(target.prototype);
    metadata.controllers.set(target, found);
    if (!isFound)
        Reflect.decorate([DiDecorators_1.Service({ transient: true })], target);
}
exports.registerControllerMetadata = registerControllerMetadata;
function attachControllerErrorHandlers(target, errorHandlers) {
    registerControllerMetadata(target, { errorHandlers });
}
exports.attachControllerErrorHandlers = attachControllerErrorHandlers;
function attachControllerMiddleware(target, middlewares, before) {
    registerControllerMetadata(target, {
        middlewares: middlewares.map(x => {
            return { before, middleware: x };
        })
    });
}
exports.attachControllerMiddleware = attachControllerMiddleware;
function attachControllerAuthorization(target, options) {
    registerControllerMetadata(target, { authorize: true, authorization: options });
}
exports.attachControllerAuthorization = attachControllerAuthorization;
