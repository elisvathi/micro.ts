import { BaseRouteDefinition } from "../brokers/IBroker";
import { Action } from '../../lib/decorators/BaseDecorators';

export interface IMiddleware {
    do(action: Action, def?: BaseRouteDefinition, controller?: any): Action | Promise<Action>;
}

export type MiddlewareFunction = (action: Action, def?: BaseRouteDefinition, controller?: any) => Action | Promise<Action>;