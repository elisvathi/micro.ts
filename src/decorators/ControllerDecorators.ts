import { ControllerOptions, AuthorizeOptions, BrokerFilter } from "./types/MethodMetadataTypes";
import { registerControllerMetadata, attachControllerMiddleware, attachControllerAuthorization, attachControllerErrorHandlers } from "./BaseDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
import { AppMiddelware } from "../middlewares/IMiddleware";

export function Controller(options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        registerControllerMetadata(target, options);
    }
}

/**
 * Controller where all the data are treated as valid JSON 
 * @param path Controller path
 * @param options Controller Options
 */
export function JsonController(path: string, options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        options.json = true;
        options.path = path;
        registerControllerMetadata(target, options);
    }
}

/**
 * Use this decorator to filter brokers for all controller methods
 * @param filter Filter function passed to the list of app brokers
 */
export function ControllerFilterBroker(filter: BrokerFilter) {
    return (target: any) => {
        registerControllerMetadata(target, { brokersFilter: filter });
    }
}

/**
 * Use this decorator to attach middlewares that are executed before the method middlewares and handler is executed
 * @param options List of middlewares to execute before any method of this controller
 */
export function BeforeMiddlewares(options: AppMiddelware[]) {
    return (target: any) => {
        attachControllerMiddleware(target, options, true);
    }
}

/**
 * Use this decorator to attach middlewares to the controller that are executed after successfully handled method , and method middlewares
 * @param options List of middlewares to execute 
 */
export function AfterMiddlewares(options: AppMiddelware[]) {
    return (target: any) => {
        attachControllerMiddleware(target, options, false);
    }
}

/**
 * Use this decorator to guard all the handlers of the controller with the authorizationChecker function.
 * Use @AllowAnonymous() decorator on methods to bypass the guard.
 * Throws NotAuthorized error if any request on methods with no bypass returns false after passing through authorizationChecker function
 * @param options Authorization options for this controller
 */
export function ControllerAuthorize(options?: AuthorizeOptions) {
    return (target: any) => {
        attachControllerAuthorization(target, options);
    }
}

/**
 * Attach error handlers for all the methods of this controller 
 * @param options List of error handlers
 */
export function ControllerErrorHandlers(options: AppErrorHandler[]) {
    return (target: any) => {
        attachControllerErrorHandlers(target, options);
    }
}
