import {DefinitionHandlerPair} from "../../AbstractBroker";
import {HttpBroker, HttpVerbs, IHttpListnerConfig} from "../HttpBroker";
import express, {Application, Request, Response} from 'express'
import {Action} from "../../../server/types";
import { TransformerDefinition } from "../../../decorators";


export class ExpressBroker extends HttpBroker<Application, Request, Response, IHttpListnerConfig> {
  public name: string = "ExpressBroker";
  protected construct(): void {
    this.server = express();
  }

  protected server!: Application;

  protected requestMapper =  async (r: Request, decoder?: TransformerDefinition) => {
    const action: Action = {
      request: {
        headers: r.headers,
        body: await this.decode(r.body, decoder),
        method: r.method,
        qs: r.query,
        params: r.params,
        raw: r,
        path: r.path
      },
      connection: r.app
    };
    return action;
  };

  protected paramWrapper(paramName: string): string {
    return `:${paramName}`;
  }

  /**
   * Register single express handler
   * @param value
   * @param route
   * @param method
   */
  protected registerHandler(value: DefinitionHandlerPair[], route: string, method: HttpVerbs): void {
    this.server[method](route, async (req: Request, res: Response) => {
      const action = await this.requestMapper(req, value[0].def.decoder);
      const handler = this.actionToRouteMapper(route, action, value);
      const result: Action = await handler(action);
      result.response = result.response || {};
      return this.respond(result, res, value[0].def.encoder);
    });
  }

  /**
   * Respond to express request
   * @param result
   * @param ctx
   */
  protected async respond(result: Action, ctx: Response, encoder? : TransformerDefinition): Promise<any> {
    let body = result.response!.body || result.response!.error;
    body = await this.encode(body, encoder);
    const headers = result.response!.headers || {};
    ctx.status(result.response!.statusCode || 200);
    Object.keys(headers).forEach(h => {
      ctx.setHeader(h, headers[h]);
    });
    ctx.send(body);
  }

  async start(): Promise<void> {
    this.registerRoutes();
    await new Promise((resolve, reject) => {
      this.server.listen(this.config.port as number, this.config.address as string, () => {
        resolve();
      });
    });
    this.log(`Server listening on address ${this.config.address} and port ${this.config.port}`);
  }
}
