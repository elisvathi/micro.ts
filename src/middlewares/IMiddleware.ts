import { BaseRouteDefinition } from "../brokers/IBroker";
import { Action } from '../../lib/decorators/BaseDecorators';
import { IBroker } from "../../lib/brokers/IBroker";

export interface IMiddleware {
    do(action: Action, def?: BaseRouteDefinition, controller?: any): Action | Promise<Action>;
}

export interface IErrorHandler {
    do(action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker): boolean | Promise<boolean>;
}

export type MiddlewareFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker) => Action | Promise<Action>;
export type ErrorHandlerFunction = (action: Action, def?: BaseRouteDefinition, controller?: any, broker?: IBroker)=>boolean | Promise<boolean>;
