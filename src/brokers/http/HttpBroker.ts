import { AbstractBroker, DefinitionHandlerPair } from "../AbstractBroker";
import { RouteMapper } from "../IBroker";
import { Action, BaseRouteDefinition } from "../../server/types";
export type HttpVerbs = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';
import { OpenAPIV3 } from 'openapi-types'

export interface IHttpListnerConfig {
  address?: string;
  port?: string | number;
}

export abstract class HttpBroker<TServer = any, TRequest = any, TContext = any, TConfig extends IHttpListnerConfig = any> extends AbstractBroker<TConfig> {

  /**
   * Broker specific server
   */
  public getConnection(): TServer {
    return this.server;
  }

  protected server!: TServer;

  protected abstract paramWrapper(paramName: string): string;

  protected abstract respond(result: Action, ctx: TContext): any;

  protected abstract registerHandler(value: DefinitionHandlerPair[], route: string, method: string): void;

  protected abstract requestMapper: (r: TRequest) => Action;

  /**
   * Maps from route definition to broker-specific route
   * @param def Route definition
   */
  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    let basePart: string = def.base;
    if (basePart && basePart.indexOf("/") !== 0) {
      basePart = `/${basePart}`;
    }

    let controllerPart: string = def.controller;

    if (controllerPart.indexOf("/") !== 0) {
      controllerPart = `/${controllerPart}`;
    }

    let handlerPart: string = def.handler;

    if (handlerPart.indexOf("/") !== 0 && handlerPart.length > 0) {
      handlerPart = `/${handlerPart}`;
    }
    let completePath: string = `${basePart}/${controllerPart}/${handlerPart}`

    const params = this.extractParamNames(completePath);
    completePath = params.map(x => {
      if (x.param) {
        return this.paramWrapper(x.name);
      }
      return x.name;
    }).join('/');
    return `${completePath}`.replace(/\/{2,}/g, "/");
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

  public getFullPath(): string{
    return `http://${this.config.address || 'localhost'}:${this.config.port || 80}`
  }

  protected registerRoutes() {
    this.registeredRoutes.forEach(async (value: DefinitionHandlerPair[], route: string) => {
      this.registerSingleRoute(value, route);
    });
  }
}
