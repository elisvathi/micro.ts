import { Body, FilterBrokers, Get, JsonController } from "../src/decorators";
import { CommandBroker } from "../src/brokers/command/CommandBroker";
import { NotFound } from "../src";
@JsonController("pull")
@FilterBrokers(b => b.constructor === CommandBroker)
export class PullController {
  @Get("mobile")
  pullMobile(
    @Body()
    body: any) {
    throw new Error("Error unknown");
  }
  @Get("native")
  pullNative() {
    throw new NotFound();
  }
  @Get("adult")
  pullAdult() {
    return "Pulling adult data...";
  }
}
