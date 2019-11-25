import { Get, JsonController } from '../../src';
import { InjectRepository } from '../../src/plugins/typeorm';
import { User } from '../models/entities/User';
import { UsersRepository } from '../models/repositories/UserRepository';

@JsonController("data")
export class DataController{
  constructor(@InjectRepository(User) private repo: UsersRepository){
  }
  @Get('')
  public async getData(){
    return this.repo.find();
  }

  @Get('custom')
  public async customCall(){
    return this.repo.getData();
  }
}
