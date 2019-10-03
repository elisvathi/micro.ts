import { IBroker } from "../../brokers/IBroker";
import { BaseRouteDefinition, Action } from "../../server/types/BaseTypes";
export interface IErrorHandler {
    do(error: any, action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): boolean | Promise<boolean>;
}
export declare type ErrorHandlerFunction = (error: any, action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => boolean | Promise<boolean>;
export declare type AppErrorHandler = IErrorHandler | ErrorHandlerFunction;
