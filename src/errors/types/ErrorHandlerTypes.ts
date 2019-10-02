import { IBroker } from "../../brokers/IBroker";
import { BaseRouteDefinition, Action } from "../../server/types/BaseTypes";

export interface IErrorHandler {
    do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): boolean | Promise<boolean>;
}

export type ErrorHandlerFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => boolean | Promise<boolean>;
