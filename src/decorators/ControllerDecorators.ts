import { ControllerOptions } from "./types/MethodMetadataTypes";
import { registerControllerMetadata, attachControllerMiddleware, attachHandlerMiddleware } from "./BaseDecorators";
import { AppMiddleware } from "../middlewares/IMiddleware";

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
 * Use this decorator to attach middlewares that are executed before the method middlewares and handler is executed
 * @param options List of middlewares to execute before any method of this controller
 */
export function BeforeMiddlewares(options: AppMiddleware[]) {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        if (!propertyKey) {
            attachControllerMiddleware(target, options, true);
        } else {
            attachHandlerMiddleware(target, propertyKey as string, descriptor as PropertyDescriptor, options.map(x => {
                return { before: true, middleware: x }
            }))
        }
    }
}

/**
 * Use this decorator to attach middlewares to the controller that are executed after successfully handled method , and method middlewares
 * @param options List of middlewares to execute
 */
export function AfterMiddlewares(options: AppMiddleware[]) {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        if (!propertyKey) {
            attachControllerMiddleware(target, options, false);
        } else {
            attachHandlerMiddleware(target, propertyKey as string, descriptor as PropertyDescriptor, options.map(x => {
                return { before: false, middleware: x };
            }))
        }
    }
}
