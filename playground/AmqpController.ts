import { Body, Get, JsonController, Post, Query, Encoder, Decoder } from "../src/decorators";
import { BadRequest, NotAuthorized } from "../src";
import { Log } from "../src/server/Logger";
import { BufferJsonTransformer, BufferStringTransformer, EmptyTransformer } from "../src/transformers/types";
@JsonController("amqp")
@Decoder(BufferStringTransformer)
export class AmqpController {
  @Get("test")
  getData(@Query() qs: any) {
    Log.warn("Error, returning bad request", {ok: false});
    throw new Error();
  }
  @Post("data-simple")
  @Decoder(EmptyTransformer)
  postData(@Body({ required: true })
    body: any) {
    console.log("BODY", body);
    return {"ok": true}
  }

  @Post("data-transformed")
  @Decoder(BufferStringTransformer)
  transformData(@Body({required: true}) body: any){
    console.log("BODY TRANSFORMED", body);
  }
}
