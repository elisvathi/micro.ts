import {DefinitionHandlerPair} from "../../AbstractBroker";
import {HttpBroker, HttpVerbs, IHttpListnerConfig} from "../HttpBroker";
import express, {Application, Request, Response} from 'express'
import {Action} from "../../../server/types";
import {IConfiguration} from "../../../server/IConfiguration";
import {BrokerBuilder} from "../../BrokerBuilder";


export class ExpressBroker extends HttpBroker<Application, Request, Response, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super(config);
    this.server = express();
  }

  protected requestMapper: (r: Request) => Action = (r: Request) => {
    const action: Action = {
      request: {
        headers: r.headers,
        body: r.body,
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

  protected registerHandler(value: DefinitionHandlerPair[], route: string, method: HttpVerbs): void {
    this.server[method](route, async (req: Request, res: Response) => {
      const action = this.requestMapper(req);
      const handler = this.actionToRouteMapper(route, action, value);
      const result: Action = await handler(action);
      result.response = result.response || {};
      return this.respond(result, res);
    });
  }

  protected respond(result: Action, ctx: Response): any {
    const body = result.response!.body || result.response!.error;
    const headers = result.response!.headers || {};
    ctx.status(result.response!.statusCode || 200);
    Object.keys(headers).forEach(h => {
      ctx.setHeader(h, headers[h]);
    });
    ctx.send(body);
  }

  async start(): Promise<void> {
    this.registerRoutes();
    await new Promise((resolve, reject)=>{
      this.server.listen(this.config.port as number, this.config.address as string, ()=>{
        resolve();
      });
    });
    console.log(`Server listening on address ${this.config.address} and port ${this.config.port}`);
  }
}

export class ExpressBrokerBuilder extends BrokerBuilder<ExpressBroker, IHttpListnerConfig> {
  constructor(config: IConfiguration) {
    super();
    this.broker = new ExpressBroker(config);
  }
}
