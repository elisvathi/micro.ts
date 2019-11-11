import {
  AfterMiddlewares,
  BeforeMiddlewares,
  Body,
  FilterBrokers,
  Get,
  Headers,
  JsonController,
  Params,
  Post,
  UseErrorHandlers
} from "../src/decorators";
import { ParamsRequest } from "./types";
import { HapiBroker } from "../src/brokers/http/hapi";
import { SocketIOBroker } from "../src/brokers/socketio";
import { AmqpBroker, TopicBasedAmqpBroker } from "../src/brokers/amqp";
import { InjectRepository } from "../src/plugins/typeorm";
import { Repository, PrimaryGeneratedColumn, Entity, Column, EntityRepository } from "typeorm";
import {sleep} from "../src/helpers/BaseHelpers";
@Entity()
export class TestModel {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
}
@EntityRepository(TestModel)
class CustomRepo extends Repository<TestModel>{
  async getById() {
  }
}

@JsonController("test" )
@FilterBrokers(b => {
  return b.constructor !== AmqpBroker;
})
export class TestController {

  @Get("parameter/:platform/:userId", { queueOptions: { autoDelete: true, durable: false } })
  @FilterBrokers(b => b.constructor === HapiBroker)
  public parameterTest(@Params({ validate: true }) params: ParamsRequest,
    @Body({ notEmpty: false }) body: any,
    @Headers() headers: any) {
    return { body, params }
  }

  @Get("test")
  @FilterBrokers(b => b.constructor === SocketIOBroker)
  public test() {
    return { ok: true };
  }

}

@JsonController("database")
export class DatabaseController {
  constructor(@InjectRepository<TestModel>(TestModel) private repo: CustomRepo) {
    // constructor(){
  }
  @Get("insert")
  public async insertData(): Promise<any> {
    const model: TestModel = new TestModel();
    model.name = `_test_model.${Math.random()}`;
    await this.repo.insert(model);
    return this.getData();
  }

  @Get("get")
  public async getData(): Promise<any> {
    return this.repo.find();
  }

}

@JsonController("amqp")
@FilterBrokers(b => b.constructor === TopicBasedAmqpBroker)
export class AmqpController {

  @Get('test', { queueOptions: { consumers: 2, exchange: { name: "Test-Exchange", type: 'topic' }, bindingPattern: "testing" } })
  async getTestData() {
    await sleep(3000);
    return { ok: true };
  }

  @Get("testim", { queueOptions: { exchange: { name: "Test-Exchange", type: 'direct' } } })
  testAnotherRoute() {
    return { ok: true };
  }

  @Post("test-default/:id/:name")
  testDefaultExchange(@Params({validate: false}) params: any){
    console.log("CALLED WITH PARAMS", params);
    return {ok: true, params};
  }
}

@JsonController("timeout", {timeout: 100})
@FilterBrokers(b=>b.constructor === HapiBroker)
export class TimeoutController{
  @Get("fixed-timeout" )
  async getFixedTimeout() {
    await sleep(200);
    return {ok: true}
  }
}
