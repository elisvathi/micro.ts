import { Action } from "../decorators/BaseDecorators";

export interface IMiddleware {
    do(action: Action): any;
}

export type MiddlewareFunction = (action: Action) => any;
