import { Body, Get, JsonController, Post, Query, Encoder, Decoder } from "../src/decorators";
import { Log } from "../src/server/Logger";
import { EmptyTransformer, BufferJsonTransformer } from "../src/transformers/types";
import { IBroker } from "../src/brokers/IBroker";
import { TopicBasedAmqpBroker } from "../src/brokers/amqp";
import { BadRequest } from "../src";
const AmqpTransformer = (b: IBroker) => {
  if (b.constructor === TopicBasedAmqpBroker) {
    return {transformer: BufferJsonTransformer, options: ['utf-8']}
  }
  return {transformer: EmptyTransformer}
}
@JsonController("amqp")
@Decoder(AmqpTransformer)
@Encoder(AmqpTransformer)
export class AmqpController {

  @Get("test")
  getData(@Query() qs: any) {
    Log.warn("Error, returning bad request", { ok: false });
    throw new BadRequest();
  }

  @Get("data-simple")
  postData(@Body({ required: false })
  body: any) {
    console.log("BODY", body);
    return { "ok": true, test: 1 }
  }

  @Post("data-transformed")
  transformData(@Body({ required: true }) body: any) {
    console.log("BODY TRANSFORMED", body);
  }
}
