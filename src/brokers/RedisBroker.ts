import {AbstractBroker} from "./AbstractBroker";
import {RequestMapper, RouteMapper} from "./IBroker";
import IORedis, {Redis} from "ioredis";
import {Action, BaseRouteDefinition} from "../server/types";
import {IConfiguration} from "../server/StartupBase";
export type RedisConfig = string;
export class RedisBroker extends AbstractBroker<RedisConfig> {
  private server!: Redis;
  private subscriber!: Redis;

  constructor(config: IConfiguration) {
    super(config);
  }

  construct(){
    this.server = new IORedis(this.config);
    this.subscriber = new IORedis(this.config);
  }
  protected requestMapper: RequestMapper = (path: string, fullPath: string, body: any)=>{
      const action: Action = {
        request: {
          params: {},
          path: fullPath,
          headers: {},
          body,
          method: 'post',
          qs: {},
          raw: {pattern: fullPath, channel: path, message: body}
        },
        connection: this.server
      };
      return action;
  };

  protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
    const handlerParams = this.extractParamNames(def.handler, '/');
    const handlerPatternPath = handlerParams.map(item=>{
      if(item.param) {
        return '*'
      }else{
        return item.name;
      }
    }).join(":");
    return `${def.base}:${def.controller}:${handlerPatternPath}`.replace(/\//g, ':');
  };

  private async consumeMessage(path: string, fullPath: string, message: string){
    const handlerPairs = this.registeredRoutes.get(path);
    if(handlerPairs){
      let body: any;
      if(handlerPairs[0].def.json){
        try{
         body = JSON.parse(message) ;
        }catch(err){
          body = message;
        }
      }else{
        body = message;
      }
      const def = handlerPairs[0].def;
      const originalPath = `${def.base}/${def.controller}/${def.handler}`.replace(/\/\//g, '/');
      const action = this.requestMapper(path, fullPath, body);
      action.request.params = this.parseParams(fullPath, originalPath);
      const handler = this.actionToRouteMapper(path, action, handlerPairs);
      const result = await handler(action);
      await this.server.del(path);
    }
  }
  private parseParams(fullPath: string, originalPath: string){
    const patternSplit = fullPath.split(':');
    const originalParams = this.extractParamNames(originalPath, "/");
    const returnValue: any ={};
    originalParams.forEach((param, index)=>{
      if(param.param){
        returnValue[param.name] = patternSplit[index];
      }
    });
    return returnValue;
  }

  public async start(): Promise<void> {
    this.construct();
    const routes:string[] = [];
    this.registeredRoutes.forEach((def, key)=>{
      routes.push(key);
    });
    await new Promise((resolve, reject)=>{
      this.subscriber.on('connect', ()=>{
        console.log(`Redis connected on ${this.config}`);
        resolve();
      });
      this.subscriber.on('error', (err)=>{
        reject(err);
      });
    });
    this.subscriber.on('pmessage', ( channel, pattern, message)=>{
      const path = channel;
      const fullPath = pattern;
      const body = message;
      this.consumeMessage(path, fullPath, body);
    });
    await this.subscriber.psubscribe(...routes);
  }

}
