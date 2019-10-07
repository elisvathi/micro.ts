import { Action, BaseRouteDefinition } from "../server/types/BaseTypes";
import { IBroker, RouteMapper, RequestMapper } from "./IBroker";
import { NotFound } from "../errors";

export type ActionHandler = (action: Action) => Action | Promise<Action>;
export type DefinitionHandlerPair = {
    def: BaseRouteDefinition,
    handler: ActionHandler
}
export type ActionToRouteMapper = (route: string,
    action: Action,
    pairs: DefinitionHandlerPair[]) => ActionHandler;

export abstract class AbstractBroker implements IBroker {
    protected registeredRoutes: Map<string, DefinitionHandlerPair[]> = new Map<string, DefinitionHandlerPair[]>();
    protected routeMapper!: RouteMapper;
    protected requestMapper!: RequestMapper;
    protected actionToRouteMapper: ActionToRouteMapper = (route: string, action: Action, pairs: DefinitionHandlerPair[]) => {
        return pairs[0].handler;
    }

    public setRequestMapper(requestMapper: RequestMapper): void {
        this.requestMapper = requestMapper;
    }

    public setRouteMapper(routeMapper: RouteMapper): void {
        this.routeMapper = routeMapper;
    }

    public setActionToHandlerMapper(mapper: ActionToRouteMapper): void {
        this.actionToRouteMapper = mapper;
    }

    public getHandler(route: string, action: Action){
        let allHandlers = this.registeredRoutes.get(route);
        allHandlers = allHandlers || [];
        if(allHandlers.length === 0){
            throw new NotFound("Not found");
        }
        return this.actionToRouteMapper(route, action, allHandlers);
    }

    public addRoute(def: BaseRouteDefinition, handler: ActionHandler): string | Promise<string> {
        const route = this.routeMapper(def);
        let registered = this.registeredRoutes.get(route);
        if (!registered) {
            registered = [];
        }
        registered.push({ def, handler });
        this.registeredRoutes.set(route, registered);
        return route;
    }

    abstract start(): Promise<void>;
}
