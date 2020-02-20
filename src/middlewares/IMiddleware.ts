import { Action, BaseRouteDefinition, Class } from "../server/types";
import { IBroker } from "../brokers/IBroker";

export interface IMiddleware {
  do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker, send?: (data: any) => Action): Action | Promise<Action>;
}

export type MiddlewareFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker, send?: (data: any) => Action) => Action | Promise<Action>;

export type AppMiddleware = Class<IMiddleware> | MiddlewareFunction;
