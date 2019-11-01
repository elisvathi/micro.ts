import {Body, FilterBrokers, Get, Headers, JsonController, Params} from "../src/decorators";
import {ParamsRequest} from "./types";
import {HapiBroker} from "../src/brokers/http/hapi";
import {SocketIOBroker} from "../src/brokers/socketio";
import {AmqpBroker} from "../src/brokers/amqp";

@JsonController("test")
@FilterBrokers(b => {
  return b.constructor !== AmqpBroker;
})
export class TestController {

  @Get("parameter/:platform/:userId", {queueOptions: {autoDelete: true, durable: false}})
  @FilterBrokers(b => b.constructor === HapiBroker)
  public parameterTest(@Params({validate: true}) params: ParamsRequest,
                       @Body({notEmpty: false}) body: any,
                       @Headers() headers: any) {
    return {body, params}
  }

  @Get("test")
  @FilterBrokers(b => b.constructor === SocketIOBroker)
  public test() {
    return {ok: true};
  }

}

@JsonController("amqp")
@FilterBrokers(b => b.constructor === AmqpBroker)
export class AmqpController {
  @Get('test', {queueOptions: {consumers: 2}})
  getTestData() {
    return {ok: true};
  }
}
