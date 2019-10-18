import {HttpBroker, RestMethods} from "./HttpBroker";
import fastify, {FastifyRequest, FastifyReply, FastifyInstance, FastifyContext} from "fastify";
import {Action} from "../server/types";
import {DefinitionHandlerPair} from "./AbstractBroker";

export class FastifyBroker extends HttpBroker<FastifyInstance, FastifyRequest, FastifyReply<any>> {

  constructor(private options: { address: string, port: number }) {
    super();
    this.server = fastify();
  };

  protected requestMapper: (r: fastify.FastifyRequest) => Action = (r: FastifyRequest) => {
    const action: Action = {
      request: {
        headers: r.headers,
        body: r.body,
        method: r.req.method,
        qs: r.query,
        params: r.params,
        raw: r,
        path: r.req.url || ""
      },
      connection: this.getConnection()
    };
    return action;
  };

  protected paramWrapper(paramName: string): string {
    return `:${paramName}`;
  }

  protected registerHandler(value: DefinitionHandlerPair[], route: string, method: RestMethods): void {
    this.server[method](route, async (req: FastifyRequest, res: FastifyReply<any>) => {
      const action = this.requestMapper(req);
      const handler = this.actionToRouteMapper(route, action, value);
      const result: Action = await handler(action);
      result.response = result.response || {};
      return this.respond(result, res);
    });
  }

  protected respond(result: Action, ctx: FastifyReply<any>): any {
    const body = result.response!.body || result.response!.error;
    const headers = result.response!.headers || {};
    ctx.code(result.response!.statusCode || 200);
    ctx.headers(headers);
    ctx.send(body);
  }

  async start(): Promise<void> {
    this.registerRoutes();
    await this.server.listen(this.options.port, this.options.address);
    console.log(`Server listening on address ${this.options.address} and port ${this.options.port}`);
  }
}
