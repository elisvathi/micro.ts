import { Action } from "../../lib/decorators/BaseDecorators";

export abstract class CoreHandler {
}
export interface BaseRouteDefinition {
    base: string;
    controller: string;
    controllerCtor: any;
    handler: string;
    handlerName: string;
    method: string;
    consumers? : number;
}

export type RouteMapper = (def: BaseRouteDefinition) => string;
export type RequestMapper = (...input: any[]) => Action;

export interface BrokerConnection<T> {
    connection: T;
}

export interface IBroker {
    addRoute(def: BaseRouteDefinition, handler: (action: Action) => any): void | Promise<void>;
    setRequestMapper(requestMapper: RequestMapper): void;
    setRouteMapper(setRouteMapper: RouteMapper): void;

    /**
     * Starts the broker connection
     */
    start(): Promise<void>;
}


