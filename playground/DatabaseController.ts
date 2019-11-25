import { Get, JsonController, Authorize, AllowAnonymous } from "../src/decorators";
import { InjectRepository } from "../src/plugins/typeorm";
import { TestModel } from "./TestModel";
import { CustomRepo } from "./controller";
@JsonController("database")
@Authorize({ roles: ['admin'], arditi: true })
export class DatabaseController {
  constructor(
    @InjectRepository<TestModel>(TestModel)
    private repo: CustomRepo) {
    // constructor(){
  }
  @Get("insert")
  @AllowAnonymous()
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
