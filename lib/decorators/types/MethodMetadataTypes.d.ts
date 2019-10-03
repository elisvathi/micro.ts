import { ParamDescription } from "./ParamMetadataTypes";
import { AppMiddelware } from "../../middlewares/IMiddleware";
import { AppErrorHandler } from "../../errors/types/ErrorHandlerTypes";
export interface MethodDescription {
    name?: string;
    metadata?: MethodOptions;
    params: ParamDescription[];
    authorize?: boolean;
    authorization?: AuthorizeOptions;
    middlewares?: MiddlewareOptions[];
    errorHandlers?: AppErrorHandler[];
}
export interface MethodOptions {
    method?: string;
    path?: string;
    brokers?: any[];
    consumers?: number;
}
export interface ControllerOptions {
    json?: boolean;
    path?: string;
    brokers?: any[];
    authorize?: boolean;
    authorization?: AuthorizeOptions;
    middlewares?: MiddlewareOptions[];
    errorHandlers?: AppErrorHandler[];
}
export interface MethodControllerOptions {
    method: MethodDescription;
    controller: ControllerOptions;
}
export interface MiddlewareOptions {
    before?: boolean;
    middleware: AppMiddelware;
}
export interface ErrorHandlerOptions {
}
export interface AuthorizeOptions {
}
