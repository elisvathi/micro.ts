import {AbstractBroker, DefinitionHandlerPair} from "./AbstractBroker";
import {RouteMapper} from "./IBroker";
import {Action, BaseRouteDefinition} from "../server/types";
export type HttpVerbs = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export abstract class HttpBroker<ServerType, RequestType, ContextType> extends AbstractBroker {

  public getConnection(): ServerType {
    return this.server;
  }

  protected server!: ServerType;

  protected abstract paramWrapper(paramName: string): string;

  protected abstract respond(result: Action, ctx: ContextType): any;

  protected abstract registerHandler(value: DefinitionHandlerPair[], route: string, method: string): void;

  protected abstract requestMapper: (r: RequestType) => Action;

  /**
   * Maps from route definition to broker-specific route
   * @param def Route definition
   */
  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    let basePart: string = def.base;
    if (basePart.indexOf("/") !== 0) {
      basePart = `/${basePart}`;
    }
    let controllerPart = def.controller;
    if (controllerPart.indexOf("/") !== 0) {
      controllerPart = `/${controllerPart}`;
    }
    let handlerPart = def.handler;
    const params = this.extractParamNames(handlerPart);
    handlerPart = params.map(x => {
      if (x.param) {
        return this.paramWrapper(x.name);
      }
      return x.name;
    }).join('/');
    if (handlerPart.indexOf("/") !== 0 && handlerPart.length > 0) {
      handlerPart = `/${handlerPart}`;
    }
    return `${basePart}${controllerPart}${handlerPart}`.replace(/\/\//g, "/");
  };

  protected registerSingleRoute(value: DefinitionHandlerPair[], route: string) {
    if (value.length > 0) {
      const methods: any = {};
      value.forEach(pair => {
        if (!methods[pair.def.method]) {
          methods[pair.def.method] = pair;
        }
      });
      Object.keys(methods).forEach((method: string) => {
        this.registerHandler(value, route, method);
      })
    }
  }

  protected registerRoutes() {
    this.registeredRoutes.forEach(async (value: DefinitionHandlerPair[], route: string) => {
      this.registerSingleRoute(value, route);
    });
  }
}
