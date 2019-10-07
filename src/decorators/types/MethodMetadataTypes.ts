import { ParamDescription } from "./ParamMetadataTypes";
import { AppMiddelware } from "../../middlewares/IMiddleware";
import { AppErrorHandler } from "../../errors/types/ErrorHandlerTypes";
import { IBroker } from "../../brokers";
export type BrokerFilter = (broker: IBroker) => boolean;
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
    brokers?: BrokerFilter;
    consumers?: number;
}

export interface ControllerOptions {
    json?: boolean;
    path?: string;
    brokersFilter?: BrokerFilter;
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

export interface ErrorHandlerOptions { }

export interface AuthorizeOptions {
    [key: string]: any;
}
