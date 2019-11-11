import { Body, Get, JsonController, Post, Query } from "../src/decorators";
import { BadRequest, NotAuthorized } from "../src";
import { Log } from "../src/server/Logger";
@JsonController("amqp")
export class AmqpController {
  @Get("test")
  getData(@Query() qs: any) {
    Log.warn("Error, returning bad request", {ok: false});
    throw new Error();
  }
  @Post("data")
  postData(
    @Body({ required: true })
    body: any) {
    return "DONE";
  }
}
