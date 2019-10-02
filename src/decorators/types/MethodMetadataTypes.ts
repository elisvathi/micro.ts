import { ParamDescription } from "./ParamMetadataTypes";
import { IMiddleware, MiddlewareFunction } from "../../middlewares/IMiddleware";

export interface MethodDescription{
    name? : string;
    metadata? : MethodOptions;
    params : ParamDescription[];
    authorize?: boolean;
    authorization? : AuthorizeOptions;
    middlewares? : MiddlewareOptions[];
    errorHandlers? : ErrorHandlerOptions[];
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
}

export interface MiddlewareOptions {
    before?: boolean;
    middleware: IMiddleware | MiddlewareFunction;
}

export interface ErrorHandlerOptions { }

export interface AuthorizeOptions { }
