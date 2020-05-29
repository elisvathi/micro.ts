import { Server as HapiServer, Request as HapiRequest, ResponseToolkit, ServerOptions as HapiServerOptions } from 'hapi';
import { DefinitionHandlerPair } from '../../AbstractBroker';
import { RequestMapper } from '../../IBroker';
import { Action } from '../../../server/types';
import { HttpBroker } from "../HttpBroker";
import { ILogger, LoggerKey } from "../../../server/Logger";
import { Container } from "../../../di";

export class HapiBroker extends HttpBroker<HapiServer, HapiRequest, ResponseToolkit, HapiServerOptions> {
  public name: string = "HapiBroker";

  private get logger(): ILogger {
    return Container.get<ILogger>(LoggerKey)
  }

  construct() {
    this.server = new HapiServer(this.config);
  }

  protected requestMapper: RequestMapper = async (r: HapiRequest) => {
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
    const filteredDef = value.find(x => x.def.method === method);
		let options = {};
		if (filteredDef && filteredDef.def.brokerRouteOptions) {
			options = filteredDef.def.brokerRouteOptions(this);
		}
    this.server.route({
      method: method,
      path: route,
      options,
      handler: async (r: HapiRequest, h: ResponseToolkit) => {
        const action = await this.requestMapper(r);
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
    this.server.listener.on("close", (e: any) => this.handleConnectionError(e));
    this.server.listener.on("error", (e: any) => this.handleConnectionError(e));
    this.logger.info(`Server listening on address ${this.config.address} and port ${this.config.port}`);
  }

  protected paramWrapper(paramName: string): string {
    return `{${paramName}}`;
  }

}
