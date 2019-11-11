import { Repository, EntityRepository } from "typeorm";
import { TestModel } from "./TestModel";
@EntityRepository(TestModel)
class CustomRepo extends Repository<TestModel> {
  async getById() {
  }
}
