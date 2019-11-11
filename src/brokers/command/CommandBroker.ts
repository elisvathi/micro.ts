import { AbstractBroker } from "../AbstractBroker";
import { RequestMapper, RouteMapper } from "../IBroker";
import { Action, BaseRouteDefinition } from "../../server/types";
import readline from 'readline';
import net from 'net';
import chalk from 'chalk';
import WriteStream = NodeJS.WriteStream;
import ReadStream = NodeJS.ReadStream;
import { parseCommand, BaseCommandRequest, parseArguments } from "../../utils/ArgumentsParser";
import { NotFound } from "../../errors";

export interface CommandInterfaceConfig {
  stdin?: boolean;
  port?: number;
  hostname?: string;
  prompt?: string;
}

export class CommandBroker extends AbstractBroker<CommandInterfaceConfig> {
  name: string = "CommandBroker";
  protected requestMapper: RequestMapper = (req: BaseCommandRequest) => {
    const action: Action = {
      request: {
        body: req.body,
        qs: req.qs,
        params: req.params,
        method: req.method,
        headers: req.headers,
        path: req.path
      }
    };
    return action;
  };
  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    return `${def.controller}.${def.handler}`.replace(/\//g, '.');
  };

  protected construct(): void {
  }

  private async handleRequestFromArgs(args: string[]) {
    return this.handleRequest(parseArguments(args));
  }

  private async handleRequest(request: BaseCommandRequest) {
    const value = this.getRouteByPath(request.path);
    if (!value || value.length === 0) {
      throw new NotFound();
    } else {
      const action = this.requestMapper(request);
      const handler = this.actionToRouteMapper(request.path, action, value);
      const result: Action = await handler(action);
      result.response = result.response || {};
      if (result.response.is_error) {
        throw result.response.error;
      } else {
        return result.response.body;
      }
    }
  }

  private async handleRequestFromLine(line: string) {
    const request = parseCommand(line);
    return this.handleRequest(request);
  }

  private getRouteByPath(path: string) {
    const routes = Array.from(this.registeredRoutes.keys());
    if (routes.includes(path)) {
      return this.registeredRoutes.get(path);
    }
  }

  writeToSocket(out: WriteStream, value: string) {
    try {
      out.write(value);
    } catch (ignored) {
      // Ignore error, socket might have been closed
    }
  }

  private async startListening(socket: ReadStream, out: WriteStream) {
    const r1 = readline.createInterface(socket, out);
    const prompt = this.config.prompt || ">>> "
    this.writeToSocket(out, `\n${prompt}`);
    r1.on('line', async (line: string) => {
      try {
        const result = await this.handleRequestFromLine(line);
        this.writeToSocket(out, chalk.green("[SUCCESS]\n"));
        this.writeToSocket(out, JSON.stringify(result, null, 2));
      } catch (err) {
        this.writeToSocket(out, chalk.red("[ERROR]\n"));
        this.writeToSocket(out, JSON.stringify(err, null, 2));
      }
      this.writeToSocket(out, `\n${prompt}`);
    });
  }

  async start(): Promise<void> {
    if (this.config.stdin) {
      await this.startListening(process.stdin, process.stdout);
    } else {
      const server = net.createServer(async (socket) => {
        await this.startListening(socket as ReadStream, socket as WriteStream);
      });
      server.listen(this.config.port || 5001, this.config.hostname || 'localhost');
      this.log(`Listening on ${this.config.hostname || 'localhost'} on port ${this.config.port || 5001}`);
    }
  }
}
