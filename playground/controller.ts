import {Body, FilterBrokers, Get, Headers, JsonController, Params} from "../src/decorators";
import {ParamsRequest} from "./types";
import {HapiBroker} from "../src/brokers/http/hapi";
import {SocketIOBroker} from "../src/brokers/socketio";
import {AmqpBroker} from "../src/brokers/amqp";
import { InjectRepository } from "../src/plugins/typeorm";
import { Repository, PrimaryGeneratedColumn, Entity, Column } from "typeorm";

@Entity()
export class TestModel {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
}

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

@JsonController("database")
export class DatabaseController{
  constructor(@InjectRepository<TestModel>(TestModel, 'default') private repo: Repository<TestModel>){
    // constructor(){
  }
  @Get("insert")
  public async insertData(): Promise<any>{
    const model: TestModel = new TestModel();
    model.name = `_test_model.${Math.random()}`;
    await this.repo.insert(model);
    return this.getData();
  }

  @Get("get")
  public async getData():Promise<any>{
    return this.repo.find();
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
