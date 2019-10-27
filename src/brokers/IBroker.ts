import { BaseRouteDefinition, Action } from "../server/types/BaseTypes";

/**
 * Maps the app level route definitions passed in the BaseRouteDefinition object, with the broker specific routes
 */
export type RouteMapper = (def: BaseRouteDefinition) => string;

/**
 * Maps the specific request object of the broker to an Action object
 */
export type RequestMapper = (...input: any[]) => Action;

export interface BrokerConnection<T> {
    connection: T;
}

export interface IBroker<TConfig = any> {
    /**
     * Register routes before the brokers starts
     * Saves the route in a broker level Map object, using its resulting route as a key and an array of handler definitions
     * If the resulting route has more than one handler registered, it is recommended to set the ActionToRoute mapper object,
     * to filter out the correct handler from the list of multiple handlers
     * @param def
     * @param handler
     */
    addRoute(def: BaseRouteDefinition, handler: (action: Action) => any): string | Promise<string>;
    setRequestMapper(requestMapper: RequestMapper): void;
    setRouteMapper(setRouteMapper: RouteMapper): void;

    /**
     * Starts the broker connection
     */
    start(): Promise<void>;
}
