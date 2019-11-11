import {Body, FilterBrokers, Get, Headers, JsonController, Params, Post, Query} from "../src/decorators";
import { ParamsRequest } from "./types";
import { HapiBroker } from "../src/brokers/http/hapi";
import { SocketIOBroker } from "../src/brokers/socketio";
import { AmqpBroker, TopicBasedAmqpBroker } from "../src/brokers/amqp";
import { InjectRepository } from "../src/plugins/typeorm";
import { Repository, PrimaryGeneratedColumn, Entity, Column, EntityRepository } from "typeorm";
import {Container} from "../src/di";
import {CommandBroker} from "../src/brokers/command/CommandBroker";
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
export class AmqpController {

  @Get("test")
  getData(@Query() qs: any){
    return qs;
  }
  @Post("data")
  postData(@Body({required: true}) body: any){
    return {ok: true, body};
  }
}

@JsonController("pull")
@FilterBrokers(b=>b.constructor === CommandBroker)
export class PullController{

  @Get("mobile")
  pullMobile() {
    return "Pulling mobile data...";
  }

  @Get("native")
  pullNative() {
    return "Pulling native data...";
  }

  @Get("adult")
  pullAdult() {
    return "Pulling adult data...";
  }

}
