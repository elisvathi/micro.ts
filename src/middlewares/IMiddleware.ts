import { Action, BaseRouteDefinition } from "../server/types";
import { IBroker } from "../brokers";

export interface IMiddleware {
    do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): Action | Promise<Action>;
}

export type MiddlewareFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => Action | Promise<Action>;

export type AppMiddleware = { new(...args: any[]): IMiddleware }| MiddlewareFunction;
