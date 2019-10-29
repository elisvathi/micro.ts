import {AbstractBroker, ConfigResolver} from "./AbstractBroker";
import {IConfiguration} from "../server";

export abstract class BrokerBuilder<T extends AbstractBroker<TConfig>, TConfig> {
  protected broker!: T;
  protected constructor(private  cfg:IConfiguration){

  }
  public withConfigResolver(configResolver: ConfigResolver<TConfig>): BrokerBuilder<T, TConfig> {
    this.broker.setConfigResolver(this.cfg, configResolver);
    return this;
  }

  public withConfig(config: TConfig): BrokerBuilder<T, TConfig> {
    this.broker.setAbsoluteConfig(config);
    return this;
  }

  public getBroker(): T {
    return this.broker;
  }
}
