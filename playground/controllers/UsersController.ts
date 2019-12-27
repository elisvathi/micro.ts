import { JsonController, Get} from '../../src';

@JsonController("users")
export class UsersController{
  @Get("")
  public getAllUsers(){
    return ["user1", "user2", "user3"]
  }
}
