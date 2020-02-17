import { JsonController, Get, Param} from '../../src';

@JsonController("users")
export class UsersController{

  @Get(":params*")
  public getAllUsers(@Param("params") param: string){
    return ["user1", "user2", "user3", param];
  }

}
