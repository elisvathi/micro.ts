import { MethodOptions, MethodDescription, AuthorizeOptions, MiddlewareOptions, ControllerOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { getGlobalMetadata } from "./GlobalMetadata";
import { ParamDescription, ParamOptions } from "./types/ParamMetadataTypes";
import { ControllerMetadata } from "./types/ControllerMetadataTypes";
import { Service } from "../di/DiDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
import { AppMiddelware } from "../middlewares/IMiddleware";

export function registerHandlerMetadata(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: MethodOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    controller[propertyKey].name = propertyKey;
    controller[propertyKey].metadata = controller[propertyKey].metadata || {};
    controller[propertyKey].metadata = { ...controller[propertyKey].metadata || {}, ...options || {} };
    controller[propertyKey].params = [];
    const existingParams = metadata.parameters.get(target);
    if (existingParams && existingParams[propertyKey]) {
        controller[propertyKey].params = existingParams[propertyKey] as ParamDescription[];
    } else {
        const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
        if (paramtypes && paramtypes.length) {
            controller[propertyKey].params.push(...paramtypes.map(x => { return { type: x } }));
        }
    }
    metadata.methods.set(target, controller);
}

export function registerParamMetadata(target: any, propertyKey: string, index: number, options?: ParamOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: ParamDescription[] } = metadata.parameters.get(target) as { [key: string]: ParamDescription[] };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || [];
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
    if (paramtypes && paramtypes.length > 0 && controller[propertyKey].length === 0) {
        controller[propertyKey].push(...paramtypes.map(x => { return { type: x } }));
    }
    controller[propertyKey][index].options = options;
    metadata.parameters.set(target, controller);
}

export function attachHandlerAuthorization(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options?: AuthorizeOptions, active: boolean = true) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.authorize = active;
    handlerObject.authorization = handlerObject.authorization || [];
    handlerObject.authorization = options;
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}

export function attachHandlerMiddleware(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: MiddlewareOptions[]) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.middlewares = handlerObject.middlewares || [];
    handlerObject.middlewares.push(...options);
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}

export function attachHandlerBrokersFitler(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: BrokerFilter) {
    registerHandlerMetadata(target, propertyKey, _descriptor, { brokers: options });
}

export function attachHandlerErrorHandler(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: AppErrorHandler[]) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.errorHandlers = handlerObject.errorHandlers || [];
    handlerObject.errorHandlers.push(...options);
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}

export function registerControllerMetadata(target: any, options?: ControllerOptions) {
    const metadata = getGlobalMetadata();
    metadata.controllers = metadata.controllers || new Map<any, ControllerMetadata>();
    const name: string = target.name;
    // let found = metadata.controllers.find(x => x.ctor === target);
    let found: ControllerMetadata | undefined = metadata.controllers.get(target);
    let isFound: boolean = !!found;
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target);

    found = found || { name, ctor: target };
    found.constructorParams = [];
    if (paramtypes && paramtypes.length) {
        found.constructorParams.push(...paramtypes.map(x => { return { type: x } }));
    }
    found.options = found.options || {};
    found.options = { ...found.options, ...(options || {}) };
    if (options && options.errorHandlers) {
        const currentErrorHandlers: AppErrorHandler[] = found.options.errorHandlers || [];
        options.errorHandlers = [...currentErrorHandlers, ...options.errorHandlers];
    }
    if (options && options.middlewares) {
        const currentMiddlewares: MiddlewareOptions[] = found.options.middlewares || [];
        options.middlewares = [...currentMiddlewares, ...options.middlewares];
    }
    found.handlers = found.handlers || metadata.methods.get(target.prototype);
    metadata.methods.delete(target.prototype);
    metadata.controllers.set(target, found);
    if (!isFound)
        Reflect.decorate([Service({ transient: true })], target);
}


export function attachControllerErrorHandlers(target: any, errorHandlers: AppErrorHandler[]) {
    registerControllerMetadata(target, { errorHandlers });
}

export function attachControllerMiddleware(target: any, middlewares: AppMiddelware[], before: boolean) {
    registerControllerMetadata(target, {
        middlewares: middlewares.map(x => {
            return { before, middleware: x };
        })
    });
}

export function attachControllerAuthorization(target: any, options?: AuthorizeOptions) {
    registerControllerMetadata(target, { authorize: true, authorization: options });
}

