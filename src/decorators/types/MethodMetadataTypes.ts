import { ParamDescription } from "./ParamMetadataTypes";
import { AppMiddleware } from "../..";
import { AppErrorHandler } from "../../errors";
import { QueueOptions } from "../../server";
import {IBroker} from "../../brokers/IBroker";
export type BrokerFilter = (broker: IBroker) => boolean;
export type BrokerRouteOptionsResolver = (broker: IBroker)=> any;
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
    timeout? : number;
    brokerRouteOptions?: BrokerRouteOptionsResolver ;
}

export interface ControllerOptions {
    json?: boolean;
    path?: string;
    brokersFilter?: BrokerFilter;
    authorize?: boolean;
    authorization?: AuthorizeOptions;
    middlewares?: MiddlewareOptions[];
    errorHandlers?: AppErrorHandler[];
    timeout?: number;
    brokerRouteOptions?: BrokerRouteOptionsResolver;
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
