import { MethodOptions, MethodDescription, AuthorizeOptions, MiddlewareOptions, ControllerOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { getGlobalMetadata } from "./GlobalMetadata";
import { ParamDescription, ParamOptions } from "./types/ParamMetadataTypes";
import { ControllerMetadata } from "./types/ControllerMetadataTypes";
import { Service } from "../di/DiDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
import { AppMiddleware } from "../middlewares/IMiddleware";
import { ServiceScope } from "../di/types/DiOptionsTypes";

/**
 * Registers or appends metadata to the method
 * If the parameters of that method are not registered (from decorations) it saves only the types of the parameters
 * @param target Target controller
 * @param propertyKey method name
 * @param _descriptor method descriptor
 * @param options Options to attach
 */
export function registerHandlerMetadata(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options: MethodOptions) {
    const metadata = getGlobalMetadata();
    // Get registered or default
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    controller[propertyKey].name = propertyKey;
    controller[propertyKey].metadata = controller[propertyKey].metadata || {};
    // Attach to existing options, necessary if method is decorated with more than 1 annotation
    controller[propertyKey].metadata = { ...controller[propertyKey].metadata || {}, ...options || {} };
    controller[propertyKey].params = [];
    // If the parameters of the method are registered copy save them to the method method metadata ...
    const existingParams = metadata.parameters.get(target);
    if (existingParams && existingParams[propertyKey]) {
        controller[propertyKey].params = existingParams[propertyKey] as ParamDescription[];
    } else {
        // ... or get only the parameter types if they are not registered
        const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
        if (paramtypes && paramtypes.length) {
            controller[propertyKey].params.push(...paramtypes.map(x => { return { type: x } }));
        }
    }
    // Save the new metadata to the global metadata structure
    metadata.methods.set(target, controller);
}

/**
 * Register metadata for a single parameter
 * @param target Target controller
 * @param propertyKey Method name
 * @param index Parameter Index
 * @param options Parameter options
 */
export function registerParamMetadata(target: any, propertyKey: string, index: number, options?: ParamOptions) {
    const metadata = getGlobalMetadata();
    // Get existing method parameters or default
    let controller: { [key: string]: ParamDescription[] } = metadata.parameters.get(target) as { [key: string]: ParamDescription[] };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || [];
    // Get types for the parameters of the method
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
    // If no metadata registered save only the parameter types
    if (paramtypes && paramtypes.length > 0 && controller[propertyKey].length === 0) {
        controller[propertyKey].push(...paramtypes.map(x => { return { type: x } }));
    }
    // Set the metadata for the current parameter using index
    controller[propertyKey][index].options = options;
    metadata.parameters.set(target, controller);
}

/**
 * Sets or unsets the authorized property for the method
 * attaches authorization options and enabled flag to the method
 * @param target Target controller
 * @param propertyKey Method name
 * @param _descriptor Method descriptor
 * @param options Authorization options
 * @param active Used to disable in case it's enabled by its controller
 */
export function attachHandlerAuthorization(target: any, propertyKey: string, _descriptor: PropertyDescriptor, options?: AuthorizeOptions, active: boolean = true) {
    const metadata = getGlobalMetadata();
    // Get registered metadata or default
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    const handlerObject = controller[propertyKey] || {};
    // Sets authorization options
    handlerObject.authorize = active;
    handlerObject.authorization = handlerObject.authorization || [];
    handlerObject.authorization = options;
    controller[propertyKey] = handlerObject;
    // Saves appended metadata
    metadata.methods.set(target, controller);
}

/**
 * Attaches middlewares to the method
 * @param target
 * @param propertyKey
 * @param _descriptor
 * @param options
 */
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

export function attachHandlerRedirect(target: any, propertyKey: string, _descriptor: PropertyDescriptor, url: string) {
	const metadata = getGlobalMetadata();
	let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
	controller = controller || {};
	controller[propertyKey] = controller[propertyKey] || { params: [] };
	const handlerObject = controller[propertyKey] || {};
	handlerObject.redirect = handlerObject.redirect || url;
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
    if (options && options.errorHandlers) {
        const currentErrorHandlers: AppErrorHandler[] = found.options.errorHandlers || [];
        options.errorHandlers = [...currentErrorHandlers, ...options.errorHandlers];
        options.timeout = options.timeout || found.options.timeout;
    }
    if (options && options.middlewares) {
        const currentMiddlewares: MiddlewareOptions[] = found.options.middlewares || [];
        options.middlewares = [...currentMiddlewares, ...options.middlewares];
    }
  found.options = { ...found.options, ...(options || {}) };
  found.handlers = found.handlers || metadata.methods.get(target.prototype);
    metadata.methods.delete(target.prototype);
    metadata.controllers.set(target, found);
    if (!isFound)
      Reflect.decorate([Service({scope: ServiceScope.Request})], target);
}


export function attachControllerErrorHandlers(target: any, errorHandlers: AppErrorHandler[]) {
    registerControllerMetadata(target, { errorHandlers });
}

export function attachControllerMiddleware(target: any, middlewares: AppMiddleware[], before: boolean) {
    registerControllerMetadata(target, {
        middlewares: middlewares.map(x => {
            return { before, middleware: x };
        })
    });
}

export function attachControllerAuthorization(target: any, options?: AuthorizeOptions) {
    registerControllerMetadata(target, { authorize: true, authorization: options });
}
