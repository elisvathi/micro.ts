import { ParamDescription } from "./ParamMetadataTypes";
import { AppMiddleware } from "../../middlewares/IMiddleware";
import { AppErrorHandler } from "../../errors/types/ErrorHandlerTypes";
import { IBroker } from "../../brokers";
import { QueueOptions } from "../../server";
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
    queueOptions?: QueueOptions;
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
    middleware: AppMiddleware;
}

export interface ErrorHandlerOptions { }

export interface AuthorizeOptions {
    [key: string]: any;
}
