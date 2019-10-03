"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractBroker {
    constructor() {
        this.registeredRoutes = new Map();
        this.actionToRouteMapper = (route, action, pairs) => {
            return pairs[0].handler;
        };
    }
    setRequestMapper(requestMapper) {
        this.requestMapper = requestMapper;
    }
    setRouteMapper(routeMapper) {
        this.routeMapper = routeMapper;
    }
    setActionToHandlerMapper(mapper) {
        this.actionToRouteMapper = mapper;
    }
    getHandler(route, action) {
        let allHandlers = this.registeredRoutes.get(route);
        allHandlers = allHandlers || [];
        if (allHandlers.length === 0) {
            // TODO: THROW NOT FOUND
            throw new Error("Not found");
        }
        return this.actionToRouteMapper(route, action, allHandlers);
    }
    addRoute(def, handler) {
        const route = this.routeMapper(def);
        let registered = this.registeredRoutes.get(route);
        if (!registered) {
            registered = [];
        }
        registered.push({ def, handler });
        this.registeredRoutes.set(route, registered);
    }
}
exports.AbstractBroker = AbstractBroker;
