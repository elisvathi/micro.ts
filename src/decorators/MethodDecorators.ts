import { AuthorizeOptions, MiddlewareOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { attachHandlerAuthorization, attachHandlerMiddleware, attachHandlerErrorHandler, attachHandlerBrokersFitler } from "./BaseDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";

export function Authorize(options?: AuthorizeOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerAuthorization(target, propertyKey, descriptor, options);
    }
}

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


export function FilterBrokers(brokers: BrokerFilter) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>{
        attachHandlerBrokersFitler(target, propertyKey, descriptor, brokers);
    }
}
