import { Action, BaseRouteDefinition } from "../server/types/BaseTypes";
import { IBroker } from "../brokers/IBroker";
export interface IMiddleware {
    do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): Action | Promise<Action>;
}
export declare type MiddlewareFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => Action | Promise<Action>;
export declare type AppMiddelware = IMiddleware | MiddlewareFunction;
