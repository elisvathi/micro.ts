import { Get, JsonController } from '../../src';

@JsonController("")
export class DataController{
  constructor(){
  }
  @Get('')
  public async getData(){
    return "get data called"
  }

  @Get('custom')
  public async customCall(){
    return "custom call called"
  }
}
