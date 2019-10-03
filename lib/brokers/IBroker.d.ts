import { BaseRouteDefinition, Action } from "../server/types/BaseTypes";
export declare type RouteMapper = (def: BaseRouteDefinition) => string;
export declare type RequestMapper = (...input: any[]) => Action;
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
