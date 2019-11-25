import { BaseRouteDefinition, Action, Class } from "../../server/types";
import {IBroker} from "../../brokers/IBroker";

export interface IErrorHandler {
    do(error: any, action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): boolean | Promise<boolean>;
}

export type ErrorHandlerFunction = (error: any, action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => boolean | Promise<boolean>;

export type AppErrorHandler = Class<IErrorHandler> | ErrorHandlerFunction;
