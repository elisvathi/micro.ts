import { Get, JsonController, Post, Body, ContainerInject, Service, FilterBrokers, Param, QueryParam, Header, Authorize } from '../../src';
import { Required, Optional, ValidOptions, DateString } from 'joi-typescript-validator';
import { getObjectSchema, getAppSchema } from '../../src/openapi/utils'
import { SpecBuilder } from '../../src/openapi/SpecBuilder';

@Service()
class LogService {
  calls: number = 0;
}
@JsonController("")
export class DataController {
  constructor(private log: LogService, private swagger: SpecBuilder) {
  }
  @Get('logs/:id/:test')
  @FilterBrokers(b => b.name === 'private')
  public getLogInfo(@QueryParam('test', { required: false }) test: number,
                    @Param('id') id: number,
                    @Header("Authorization") auth: string,
                    @Param('test') testParam: string) {
    return {testParam, id}
  }

  @Get('swagger')
  getSwagger() {
    return this.swagger.getDocument();
  }

  @Get(':name')
  @Authorize()
  public async getData(@Param('name') name: string) {
    return "get data called"
  }

  @Post(':name')
  public async postData(@Param('name') name: string) {
    return "get data called"
  }

  @Get('custom')
  public async customCall() {
    return "custom call called"
  }
}
