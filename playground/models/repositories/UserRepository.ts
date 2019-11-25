import { Repository, EntityRepository} from 'typeorm';
import {User} from '../entities/User';
@EntityRepository(User)
export class UsersRepository extends Repository<User>{
  async getData(){
    const result = await this.find({});
    return {ok: true, data: result};
  }
}
