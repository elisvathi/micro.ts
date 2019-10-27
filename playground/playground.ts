import {getSchema, Required, ValidOptions} from "joi-typescript-validator";
import {Action} from "../src/server/types";
import {AuthorizeOptions} from "../src/decorators/types";
import {BaseServer} from "../src/server";
import { JsonController, Param, Post, Get, Params, Body, Headers, AfterMiddlewares, Query, AmqpBroker} from '../src';
import {TopicBasedAmqpBroker} from '../src/brokers/TopicBasedAmqpBroker';
import * as Joi from 'joi';
import {FastifyBroker} from "../src/brokers/FastifyBroker";
import {RedisBroker} from "../src/brokers/RedisBroker";

class ParamsRequest {
  @Required()
  @ValidOptions('mobile', 'adult', 'native')
  platform!: string;
  @Required()
  userId!: number;
}

@JsonController("test")
export class TestController {

  @Get("parameter/:platform/:userId", {queueOptions: {autoDelete: true, durable: false}})
  public parameterTest(@Params({validate: true}) params: ParamsRequest, @Body({notEmpty: false}) body: any,
                       @Headers() headers: any) {
    return {body, params}
  }

}

async function main() {
  const HttpConfig = {address: '0.0.0.0', port: 8080};
  const AmqpConfig = {url: 'amqp://localhost'};
  const RedisConfig = {url: 'redis://localhost:6379/1'};
  const httpBroker = new FastifyBroker(HttpConfig);
  const redisBroker = new RedisBroker(RedisConfig);
  const amqp = new AmqpBroker(AmqpConfig);
  const server = new BaseServer({
    controllers: [TestController],
    brokers: [amqp],
    logRequests: true,
    logErrors: false,
    basePath: 'api',
    errorHandlers: [(err: any) => {
      // console.log(err);
      return false;
    }],
    dev: true,
    validateFunction: (value: any, type: any) => {
      const schema = getSchema(type);
      return Joi.validate(value, schema);
    },
    currentUserChecker: (a: Action) => {
      return {};
    },
    authorizationChecker: (_a: Action, _options?: AuthorizeOptions) => {
      return false;
    }
  });
  await server.start();
  // amqp.getConnection().on('close', () => {
  //     console.log("CLOSED");
  // });
}

main().catch(console.log);
