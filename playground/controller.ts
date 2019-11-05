import { Body, FilterBrokers, Get, Headers, JsonController, Params } from "../src/decorators";
import { ParamsRequest } from "./types";
import { HapiBroker } from "../src/brokers/http/hapi";
import { SocketIOBroker } from "../src/brokers/socketio";
import { AmqpBroker } from "../src/brokers/amqp";
import { InjectRepository } from "../src/plugins/typeorm";
import { Repository, PrimaryGeneratedColumn, Entity, Column, EntityRepository } from "typeorm";
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

@JsonController("test")
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
@FilterBrokers(b => b.constructor === AmqpBroker)
export class AmqpController {

  @Get('test', { queueOptions: { consumers: 2, exchange: { name: "Test-Exchange", type: 'topic' }, bindingPattern: "testing" } })
  getTestData() {
    return { ok: true };
  }

  @Get("testim", { queueOptions: { exchange: { name: "Test-Exchange", type: 'direct' } } })
  testAnotherRoute() {
    return { ok: true };
  }
  @Get("test-default", {queueOptions: {bindingPattern: "t-t-t-t"}})
  testDefaultExchange(){
    return {ok: true};
  }
}
