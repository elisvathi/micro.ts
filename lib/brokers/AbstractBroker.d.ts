import { Action, BaseRouteDefinition } from "../server/types/BaseTypes";
import { IBroker, RouteMapper, RequestMapper } from "./IBroker";
export declare type ActionHandler = (action: Action) => Action | Promise<Action>;
export declare type DefinitionHandlerPair = {
    def: BaseRouteDefinition;
    handler: ActionHandler;
};
export declare type ActionToRouteMapper = (route: string, action: Action, pairs: DefinitionHandlerPair[]) => ActionHandler;
export declare abstract class AbstractBroker implements IBroker {
    protected registeredRoutes: Map<string, DefinitionHandlerPair[]>;
    protected routeMapper: RouteMapper;
    protected requestMapper: RequestMapper;
    protected actionToRouteMapper: ActionToRouteMapper;
    setRequestMapper(requestMapper: RequestMapper): void;
    setRouteMapper(routeMapper: RouteMapper): void;
    setActionToHandlerMapper(mapper: ActionToRouteMapper): void;
    getHandler(route: string, action: Action): ActionHandler;
    addRoute(def: BaseRouteDefinition, handler: ActionHandler): void | Promise<void>;
    abstract start(): Promise<void>;
}
