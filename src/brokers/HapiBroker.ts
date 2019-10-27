import {Server as HapiServer, Request as HapiRequest, ResponseToolkit} from 'hapi';
import {AbstractBroker, DefinitionHandlerPair} from './AbstractBroker';
import {RouteMapper, RequestMapper} from './IBroker';
import {BaseRouteDefinition, Action} from '../server/types/BaseTypes';
import {HttpBroker} from "./HttpBroker";

export class HapiBroker extends HttpBroker<HapiServer, HapiRequest, ResponseToolkit> {
  constructor(
    private options: {
      address: string;
      port: number;
    }, cors: boolean | any = false) {
    super();
    this.server = new HapiServer({
      address: options.address, port: options.port, routes: {cors}
    });
  }

  protected requestMapper: RequestMapper = (r: HapiRequest) => {
    const act: Action = {
      request: {
        params: r.params,
        path: r.path,
        headers: r.headers,
        method: r.method,
        body: r.payload,
        qs: r.query,
        raw: r,
      },
      connection: r.server
    };
    return act;
  };

  protected respond(result: Action, h: ResponseToolkit) {
    const body = result.response!.body || result.response!.error;
    let response = h.response(body).code(result.response!.statusCode || 200);
    const headers = result.response!.headers || {};
    Object.keys(headers).forEach(h => {
      response = response.header(h, headers[h])
    });
    return response;
  }

  protected registerHandler(value: DefinitionHandlerPair[], route: string, method: string) {
    this.server.route({
      method: method,
      path: route,
      handler: async (r: HapiRequest, h: ResponseToolkit) => {
        const action = this.requestMapper(r);
        const handler = this.actionToRouteMapper(route, action, value);
        const result: Action = await handler(action);
        result.response = result.response || {};
        return this.respond(result, h);
      }
    });
  }


  public async start(): Promise<void> {
    this.registerRoutes();
    await this.server.start();
    console.log(`Server listening on address ${this.options.address} and port ${this.options.port}`);
  }

  protected paramWrapper(paramName: string): string {
    return `{${paramName}}`;
  }

}
