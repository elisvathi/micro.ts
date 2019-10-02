import { ControllerOptions, AuthorizeOptions } from "./types/MethodMetadataTypes";
import { registerControllerMetadata, attachControllerMiddleware, attachControllerAuthorization, attachControllerErrorHandlers } from "./BaseDecorators";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
import { AppMiddelware } from "../middlewares/IMiddleware";

export function Controller(options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        registerControllerMetadata(target, options);
    }
}

export function JsonController(path: string, options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        options.json = true;
        options.path = path;
        registerControllerMetadata(target, options);
    }
}

export function BeforeMiddlewares(options: AppMiddelware[]){
    return (target: any)=>{
        attachControllerMiddleware(target, options, true);
    }
}

export function AfterMiddlewares(options: AppMiddelware[]){
    return (target: any)=>{
        attachControllerMiddleware(target, options, false);
    }
}

export function ControllerAuthorize(options? : AuthorizeOptions) {
    return (target: any) => {
        attachControllerAuthorization(target, options);
    }
}

export function ControllerErrorHandlers(options: AppErrorHandler[]) {
    return (target: any) => {
        attachControllerErrorHandlers(target, options);
    }
}
