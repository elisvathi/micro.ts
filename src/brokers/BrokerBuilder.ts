import {AbstractBroker, ConfigResolver} from "./AbstractBroker";

export abstract class BrokerBuilder<T extends AbstractBroker<TConfig>, TConfig> {
  protected broker!: T;

  public withConfigResolver(configResolver: ConfigResolver<TConfig>): BrokerBuilder<T, TConfig> {
    this.broker.setConfigResolver(configResolver);
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
