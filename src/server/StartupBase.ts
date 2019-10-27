import { ServerOptions } from "./types/ServerOptions";
import {AbstractBroker, AmqpBroker, HapiBroker, IBroker, SocketIOBroker} from "../brokers";
import { Class, Action } from "./types";
import { AppMiddleware } from "../middlewares/IMiddleware";
import { AppErrorHandler } from "../errors";
import { AuthorizeOptions } from "../decorators";
import {ConfigResolver} from "../brokers/AbstractBroker";
import {ServerOptions as HapiServerOptions} from 'hapi';
import {IAmqpConfig} from "../brokers/AmqpBroker";
import {TopicBasedAmqpBroker, TopicBasedAmqpConfig} from "../brokers/TopicBasedAmqpBroker";
import {ExpressBroker} from "../brokers/ExpressBroker";
import {IHttpListnerConfig} from "../brokers/HttpBroker";
import {RedisBroker, RedisConfig} from "../brokers/RedisBroker";
import {SocketIOConfig} from "../brokers/SocketIOBroker";
import {KoaBroker} from "../brokers/KoaBroker";
import {FastifyBroker} from "../brokers/FastifyBroker";
import {BaseServer} from "./BaseServer";
import {options} from "joi";
export type BrokerResolver<T extends BrokerBuilder<any, any>> = (builder: T)=>BrokerBuilder<any, any>;
export type AuthorizationFunction = (action: Action, options?: AuthorizeOptions) => boolean;
export type CurrentUserCheckerFunction<TUser> = (action: Action, broker?: IBroker) => TUser;
export interface IConfiguration{
  getFromPath<T>(path: string): T;
}
export class OptionsBuilder {
  constructor(private config: IConfiguration){}
  private options: ServerOptions = {
    brokers: [],
    controllers: [],
    beforeMiddlewares: [],
    afterMiddlewares: [],
    errorHandlers: [],
  };

  public get serverOptions(): ServerOptions {
    return this.options;
  }

  public setDevMode(val: boolean): OptionsBuilder {
    this.options.dev = val;
    return this;
  }

  setBasePath(val: string):OptionsBuilder{
    this.options.basePath = val;
    return this;
  }

  public setLogRequests(val: boolean): OptionsBuilder {
    this.options.logRequests = val;
    return this;
  }

  public setLogErrors(val: boolean): OptionsBuilder {
    this.options.logErrors = val;
    return this;
  }

  public addBroker(broker: IBroker){
    this.options.brokers!.push(broker);
  }

  public useHapiBroker(builder: BrokerResolver<HapiBrokerBuiler>){
    const broker_builder = new HapiBrokerBuiler(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useExpressBroker(builder: BrokerResolver<ExpressBrokerBuilder>){
    const broker_builder = new ExpressBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useKoaBroker(builder: BrokerResolver<KoaBrokerBuilder>){
    const broker_builder = new KoaBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useFastifyBroker(builder: BrokerResolver<FastifyBrokerBuilder>){
    const broker_builder = new FastifyBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useAmqpBroker(builder: BrokerResolver<AmqpBrokerBuilder>){
    const broker_builder = new AmqpBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useTopicBasedAmqpBroker(builder: BrokerResolver<TopicBasedAmqpBuilder>){
    const broker_builder = new TopicBasedAmqpBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useRedisBroker(builder: BrokerResolver<RedisBrokerBuilder>){
    const broker_builder = new RedisBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public useSocketIoBroker(builder: BrokerResolver<SocketIoBrokerBuilder>){
    const broker_builder = new SocketIoBrokerBuilder(this.config);
    this.options.brokers!.push(builder(broker_builder).getBroker());
  }

  public addControllers(...controllers: Class<any>[]): OptionsBuilder {
    this.options.controllers.push(...controllers);
    return this;
  }

  public addBeforeMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
    this.options.beforeMiddlewares!.push(...middlewares);
    return this;
  }

  public addAfterMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
    this.options.afterMiddlewares!.push(...middlewares);
    return this;
  }

  public addErrorHandlers(...handlers: AppErrorHandler[]): OptionsBuilder {
    this.options.errorHandlers!.push(...handlers);
    return this;
  }

  public useAuthorization(handler: AuthorizationFunction): OptionsBuilder {
    this.options.authorizationChecker = handler;
    return this;
  }

  public useAuthentication<TUser>(checker: CurrentUserCheckerFunction<TUser>): OptionsBuilder {
    this.options.currentUserChecker = checker;
    return this;
  }
}

export abstract class BrokerBuilder<T extends AbstractBroker<TConfig> ,TConfig> {
  protected broker!: T;
  public withConfiguration(resolver: ConfigResolver<TConfig>): BrokerBuilder<T, TConfig> {
    this.broker.setConfigResolver(resolver);
    return this;
  }
  public getBroker(): T{
    return this.broker;
  }
}

// HTTP BROKER BUILDERS
export class HapiBrokerBuiler extends BrokerBuilder<HapiBroker, HapiServerOptions>{
  constructor(config: IConfiguration){
    super();
    this.broker = new HapiBroker(config);
  }
}
export class ExpressBrokerBuilder extends BrokerBuilder<ExpressBroker, IHttpListnerConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new ExpressBroker(config);
  }
}
export class KoaBrokerBuilder extends BrokerBuilder<KoaBroker, IHttpListnerConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new KoaBroker(config);
  }
}
export class FastifyBrokerBuilder extends BrokerBuilder<FastifyBroker, IHttpListnerConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new FastifyBroker(config);
  }
}

// AMQP BROKER BUILDERS
export class AmqpBrokerBuilder extends BrokerBuilder<AmqpBroker, IAmqpConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new AmqpBroker(config);
  }
}

export class TopicBasedAmqpBuilder extends BrokerBuilder<TopicBasedAmqpBroker, TopicBasedAmqpConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new TopicBasedAmqpBroker(config);
  }
}

// OTHER BROKER BUILDERS
export class RedisBrokerBuilder extends BrokerBuilder<RedisBroker, RedisConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new RedisBroker(config);
  }
}
export class SocketIoBrokerBuilder extends BrokerBuilder<SocketIOBroker, SocketIOConfig>{
  constructor(config: IConfiguration){
    super();
    this.broker = new SocketIOBroker(config);
  }
}

export abstract class StartupBase {
  private readonly builder: OptionsBuilder;
  constructor(config: IConfiguration){
    this.builder = new OptionsBuilder(config);
  }
  public abstract async beforeStart(): Promise<void>;
  public abstract async afterStart(): Promise<void>;
  public getServerOptions(): ServerOptions {
    this.configureServer(this.builder);
    return this.builder.serverOptions;
  }
  public abstract configureServer(builder: OptionsBuilder): void;
}

export class AppBuilder{
  constructor(private config: IConfiguration){}
  private startupBuilder!: StartupBase;
  private server!: BaseServer;
  useStartup<T extends StartupBase>(c: Class<StartupBase>): AppBuilder{
    this.startupBuilder = new c(this.config);
    return this;
  }
  public getServer(): BaseServer{
    if(!this.server){
    const options = this.startupBuilder.getServerOptions();
    this.server = new BaseServer(options);
    }
    return this.server;
  }
  public async start(){
    await this.startupBuilder.beforeStart();
    await this.getServer().start();
    await this.startupBuilder.afterStart();
  }
}
