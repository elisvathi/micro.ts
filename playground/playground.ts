import {getSchema, Required, ValidOptions} from "joi-typescript-validator";
import {Action} from "../src/server/types";
import {AuthorizeOptions} from "../src/decorators/types";
import {BaseServer} from "../src/server";
import {HapiBroker} from "../src/brokers";
import {JsonController, Param, Post, Get, Params, Body, Headers, AfterMiddlewares, Query} from '../src';
import {TopicBasedAmqpBroker} from '../src/brokers/TopicBasedAmqpBroker';
import * as Joi from 'joi';
import {ExpressBroker} from "../src/brokers/ExpressBroker";
import {KoaBroker} from "../src/brokers/KoaBroker";

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
  public parameterTest(@Params({validate: true}) params: ParamsRequest, @Query({notEmpty: true}) body: any,
                       @Headers() headers: any) {
    return {body, params}
  }

}

async function main() {
  const HttpConfig = {address: '0.0.0.0', port: 8080};
  const AmqpConfig = {url: 'amqp://localhost'};
  const httpBroker = new KoaBroker(HttpConfig);
  const amqp = new TopicBasedAmqpBroker(AmqpConfig);
  const server = new BaseServer({
    controllers: [TestController],
    brokers: [httpBroker],
    logRequests: true,
    basePath: 'api',
    errorHandlers: [(err: any) => {
      console.log(err);
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
