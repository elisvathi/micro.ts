import { ServerOptions } from "./types";
import { OptionsBuilder } from "./OptionsBuilder";
import { IConfiguration } from "./IConfiguration";

export abstract class StartupBase {
  /**
   * Constructor initialized options builder
   */
  public readonly builder: OptionsBuilder;

  constructor(config: IConfiguration) {
    this.builder = new OptionsBuilder(config);
  }

  public async callBeforeStartHooks() {
    const hooks = this.builder.beforeStartHooks;
    for (let i = 0; i < hooks.length; i++) {
      await hooks[i]();
    }
  }

  public async callAfterStartHooks() {
    const hooks = this.builder.afterStartHooks;
    for (let i = 0; i < hooks.length; i++) {
      await hooks[i]();
    }
  }
  /**
   * Executed before  the server is started, use it for Database Connections,
   * and other async processes that are not broker-related
   */
  public abstract async beforeStart(): Promise<void>;

  /**
   * Executed after the server is started, use to set asynchronous dependencies
   */
  public abstract async afterStart(): Promise<void>;

  /**
   * Calls the configure server method, to update the builder, and returns the build options
   */
  public getServerOptions(): ServerOptions {
    this.configureServer(this.builder);
    return this.builder.serverOptions;
  }
  public abstract configureServer(builder: OptionsBuilder): void;
}
