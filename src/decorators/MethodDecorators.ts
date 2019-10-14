import { AuthorizeOptions, MiddlewareOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { attachHandlerAuthorization, attachHandlerMiddleware, attachHandlerErrorHandler, attachHandlerBrokersFitler } from "./BaseDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";

/**
 * Use this decorator to guard the method by filtering the request through authorizationChecker server function 
 * Throws NotAuthorized error if the authorizationChecker returns false
 * @param options
 */
export function Authorize(options?: AuthorizeOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerAuthorization(target, propertyKey, descriptor, options);
    }
}

/**
 * Overrides the controller Authorization guard by disabling it for the methods it decorates
 */
export function AllowAnonymous() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerAuthorization(target, propertyKey, descriptor, undefined, false);
    }
}

/**
 * Registers middlewares for the handler it decorates
 * @param options
 */
export function UseMiddlewares(options: MiddlewareOptions[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerMiddleware(target, propertyKey, descriptor, options);
    }
}

/**
 * Register error handler for the handler it decorates 
 * @param options
 */
export function UseErrorHandler(options: AppErrorHandler[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerErrorHandler(target, propertyKey, descriptor, options);
    }
}


/**
 * Filter controller brokers for this methods 
 * @param brokers Filter function, applied to the list of brokers enabled for this method's controller
 */
export function FilterBrokers(brokers: BrokerFilter) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>{
        attachHandlerBrokersFitler(target, propertyKey, descriptor, brokers);
    }
}
