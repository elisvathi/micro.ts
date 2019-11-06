import {AmqpBroker} from "./AmqpBroker";
import { IAmqpConfig, TopicBasedAmqpConfig, IAmqpExchangeConfig} from "./types";

export class TopicBasedAmqpBroker extends AmqpBroker<TopicBasedAmqpConfig> {
  public name = "TopicBasedAmqpBroker"
  public get baseTopic(): string {
    return this.config.topic;
  }

  /**
   * Override of getter for default exchange, return configured topic instead
   */
  public get defaultExchange(): IAmqpExchangeConfig {
    return {type: 'topic', name: this.baseTopic}
  }

  /**
   * Use only the name of the given value to set the topic exchange name
   * @param value
   */
  public set defaultExchange(value: IAmqpExchangeConfig) {
    this.config.topic = value.name;
  }

  /**
   * Init default topic exchange
   */
  protected construct(): void{
    this.defaultExchange = {type: "topic", name: this.baseTopic};
  }

  protected get connectionConfig(): IAmqpConfig {
    return this.config.connection;
  }

}
