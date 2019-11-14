import { Request as HapiRequest, ResponseToolkit, Server as HapiServer, ServerOptions as HapiServerOptions } from 'hapi';
import { Action } from '../../../server/types';
import { DefinitionHandlerPair } from '../../AbstractBroker';
import { RequestMapper } from '../../IBroker';
import { HttpBroker } from "../HttpBroker";
import { TransformerDefinition } from '../../../decorators';

export class HapiBroker extends HttpBroker<HapiServer, HapiRequest, ResponseToolkit, HapiServerOptions> {
  public name: string = "HapiBroker";

  construct() {
    this.server = new HapiServer(this.config);
  }

  protected requestMapper: RequestMapper = async (r: HapiRequest, decoder? : TransformerDefinition) => {
    const act: Action = {
      request: {
        params: r.params,
        path: r.path,
        headers: r.headers,
        method: r.method,
        body: await this.decode(r.payload, decoder),
        qs: r.query,
        raw: r,
      },
      connection: r.server
    };
    return act;
  };

  protected async respond(result: Action, h: ResponseToolkit, encoder?: TransformerDefinition) {
    let body = result.response!.body || result.response!.error;
    body = await this.encode(body, encoder);
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
        const action = await this.requestMapper(r, value[0].def.decoder);
        const handler = this.actionToRouteMapper(route, action, value);
        const result: Action = await handler(action);
        result.response = result.response || {};
        return this.respond(result, h, value[0].def.encoder);
      }
    });
  }


  public async start(): Promise<void> {
    this.registerRoutes();
    await this.server.start();
    this.log(`Server listening on address ${this.config.address} and port ${this.config.port}`);
  }

  protected paramWrapper(paramName: string): string {
    return `{${paramName}}`;
  }

}
