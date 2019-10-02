import { MethodOptions, MethodDescription, AuthorizeOptions, MiddlewareOptions, ErrorHandlerOptions, ControllerOptions } from "./types/MethodMetadataTypes";
import { getGlobalMetadata } from "./GlobalMetadata";
import { ParamDescription, ParamOptions } from "./types/ParamMetadataTypes";
import { ControllerMetadata } from "./types/ControllerMetadataTypes";
import { Service } from "../di/DiDecorators";

export function registerHandlerMetadata(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: MethodOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    controller[propertyKey].name = propertyKey;
    controller[propertyKey].metadata = options;
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
    metadata.parameters.delete(target);
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

export function attachHandlerAuthorization(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options?: AuthorizeOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.authorize = true;
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

export function attachHandlerErrorHandler(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: ErrorHandlerOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    handlerObject.errorHandlers = handlerObject.errorHandlers || [];
    handlerObject.errorHandlers.push(options);
    controller[propertyKey] = handlerObject;
    metadata.methods.set(target, controller);
}

export function registerControllerMetadata(target: any, options?: ControllerOptions) {
    const metadata = getGlobalMetadata();
    metadata.controllers = metadata.controllers || [];
    const name: string = target.name;
    // let found = metadata.controllers.find(x => x.ctor === target);
    let found: ControllerMetadata | undefined = metadata.controllers.get(target);
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target);

    found = found || { name, ctor: target };
    found.constructorParams = [];
    if (paramtypes && paramtypes.length) {
        found.constructorParams.push(...paramtypes.map(x => { return { type: x } }));
    }
    found.options = options;
    found.handlers = metadata.methods.get(target.prototype);
    metadata.methods.delete(target.prototype);
    metadata.controllers.set(target, found);
    Reflect.decorate([Service({ transient: true })], target);
}
