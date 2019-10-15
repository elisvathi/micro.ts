import { AuthorizeOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { attachHandlerAuthorization, attachHandlerErrorHandler, attachHandlerBrokersFitler, attachControllerAuthorization, attachControllerErrorHandlers, registerControllerMetadata } from "./BaseDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";

/**
 * Use this decorator to guard the method by filtering the request through authorizationChecker server function 
 * Throws NotAuthorized error if the authorizationChecker returns false
 * @param options
 */
export function Authorize(options?: AuthorizeOptions) {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        if (propertyKey) {
            attachHandlerAuthorization(target, propertyKey as string, descriptor as PropertyDescriptor, options);
        } else {
            attachControllerAuthorization(target, options);
        }
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
 * Register error handler for the handler it decorates
 * @param options
 */
export function UseErrorHandlers(options: AppErrorHandler[]) {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        if (propertyKey) {
            attachHandlerErrorHandler(target, propertyKey as string, descriptor as PropertyDescriptor, options);
        } else {
            attachControllerErrorHandlers(target, options);
        }
    }
}

/**
 * Filter controller brokers for this methods
 * @param brokers Filter function, applied to the list of brokers enabled for this method's controller
 */
export function FilterBrokers(brokers: BrokerFilter) {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        if (propertyKey) {
            attachHandlerBrokersFitler(target, propertyKey as string, descriptor as PropertyDescriptor, brokers);
        } else {
            registerControllerMetadata(target, { brokersFilter: brokers });
        }
    }
}
