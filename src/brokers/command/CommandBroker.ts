import {AbstractBroker} from "../AbstractBroker";
import {RequestMapper, RouteMapper} from "../IBroker";
import {Action, BaseRouteDefinition} from "../../server/types";
import readline from 'readline';
import net from 'net';
import chalk from 'chalk';
import minimist from "minimist";
import WriteStream = NodeJS.WriteStream;
import ReadStream = NodeJS.ReadStream;
import {Container} from "../../di";
import {ILogger, LoggerKey} from "../../server/Logger";

export class CommandRequest {
  body: any = "";
  qs: any = {};
  params: any = {};
  path: string = "";
  headers: any = {};
  method: string = "";
}

export interface CommandInterfaceConfig {
  stdin?: boolean;
  port?: number;
  hostname?: string;
}

export class CommandBroker extends AbstractBroker<CommandInterfaceConfig> {
  name: string = "CommandBroker";
  protected requestMapper: RequestMapper = (req: CommandRequest) => {
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

  private tryParseJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }

  private splitCommand(line: string) {
    let regexpMatches = line.match(/"(?:[^"\\]|\\.)*"/g);
    let splits = line.split(/"(?:[^"\\]|\\.)*"/g);
    regexpMatches = regexpMatches || [];
    regexpMatches = Array.from(regexpMatches);
    let result = [];
    while (splits.length > 0 && regexpMatches.length > 0) {
      result.push(splits.shift());
      result.push(regexpMatches.shift());
    }
    result.push(...splits);
    result.push(...regexpMatches);
    const finalResult: string[] = [];
    result.forEach(item => {
      if (!!item) {
        if (item[0] === "\"") {
          finalResult.push(item);
        } else {
          const itemSplit = item.trim().split(" ").filter(x => x.length > 0);
          finalResult.push(...itemSplit);
        }
      }
    });
    return finalResult;
  }

  private parseCommand(line: string) {
    const split = this.splitCommand(line);
    if (split.length < 1) {
      // return "Not enough arguments"
      throw new Error("Not enoguh arguments");
    }
    // const method = split[0].toUpperCase();
    const method = 'Command';
    const path = split[0];
    const args = minimist(split.slice(1));
    const request = new CommandRequest();
    request.body = args.body || {};
    if(typeof  request.body  === 'string'){
      request.body = this.tryParseJson(request.body);
    }
    request.headers = args.headers || {};
    request.path = path;
    request.method = method;
    request.params = {};
    const argsCopy = {...args};
    delete argsCopy.body;
    delete argsCopy.headers;
    delete argsCopy['__'];
    delete argsCopy['_'];
    request.qs = argsCopy;
    return request;
  }

  private async handleRequest(line: string) {
    const request = this.parseCommand(line);
    const value = this.getRouteByPath(request.path);
    if (!value || value.length === 0) {
      throw new Error("Not found");
    } else {
      const action = this.requestMapper(request);
      const handler = this.actionToRouteMapper(request.path, action, value);
      const result: Action = await handler(action);
      result.response = result.response || {};
      return JSON.stringify(result.response, null, 4);
    }
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
    this.writeToSocket(out, "\n--> ");
    r1.on('line', async (line: string) => {
      try {
        const result = await this.handleRequest(line);
        this.writeToSocket(out, result);
      } catch (err) {
        this.writeToSocket(out, chalk.red(err.message || "Internal server error"));
      }
      this.writeToSocket(out, "\n--> ");
    });
  }

  async start(): Promise<void> {
    if (this.config.stdin) {
      await this.startListening(process.stdin, process.stdout);
    } else {
      const server = net.createServer(async (socket) => {
        await this.startListening(socket, socket);
      });
      server.listen(this.config.port || 5001, this.config.hostname || 'localhost');
      Container.get<ILogger>(LoggerKey).info(`${this.name} listening on ${this.config.hostname || 'localhost'} on port ${this.config.port || 5001}`);
    }
  }
}
