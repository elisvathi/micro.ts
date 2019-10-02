import { AuthorizeOptions, MiddlewareOptions, ErrorHandlerOptions } from "./types/MethodMetadataTypes";
import { attachHandlerAuthorization, attachHandlerMiddleware, attachHandlerErrorHandler } from "./BaseDecorators";

export function Authorize(options?: AuthorizeOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerAuthorization(target, propertyKey, descriptor, options);
    }
}

export function AllowAnonymous() {
    return (_target: any, _propertyKey: string, _descriptor: PropertyDescriptor) => {
        throw new Error("Function not implemented");
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
export function UseErrorHandler(options: ErrorHandlerOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerErrorHandler(target, propertyKey, descriptor, options);
    }
}
