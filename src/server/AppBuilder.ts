import { BaseServer } from "./BaseServer";
import { Class } from "./types";
import { StartupBase } from "./StartupBase";
import { IConfiguration } from "./IConfiguration";
import {BaseLogger, LoggerKey} from "./Logger";
import {Container} from "../di";

export class AppBuilder {
  constructor(private config: IConfiguration) {
    Container.set(LoggerKey, new BaseLogger());
  }

  private startupBuilder!: StartupBase;
  private server!: BaseServer;

  useStartup<T extends StartupBase>(c: Class<T>): AppBuilder {
    this.startupBuilder = new c(this.config);
    return this;
  }

  public async startServer(): Promise<BaseServer> {
    if (!this.server) {
      const options = this.startupBuilder.getServerOptions();
      this.server = new BaseServer(options);
      await this.startupBuilder.callBeforeStartHooks();
      await this.server.start();
      await this.startupBuilder.callAfterStartHooks();
    }
    return this.server;
  }

  public async start() {
    await this.startupBuilder.beforeStart();
    await this.startServer();
    await this.startupBuilder.afterStart();
  }
}
