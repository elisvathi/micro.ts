import { Optional } from 'joi-typescript-validator';
import { Body, FilterBrokers, Get, Header, JsonController, Param, Post, QueryParam, Service, BrokerRouteOptions, Headers, Action } from '../../src';
import { SpecBuilder } from '../../src/openapi/SpecBuilder';
import { FirstService } from '../services/FirstSerivce';
import { ServiceScope } from '../../src/di/types/DiOptionsTypes';
import { ContainerModule } from '../../src/di/ContainerModule';

export class TestValdiator {
  @Optional()
  items?: any[];
}

@Service({ scope: ServiceScope.Request })
class LogService {
  constructor(private module: ContainerModule, private action: Action) { }
  calls: number = 0;
  get controller(): DataController {
    return this.module.get<DataController>(DataController);
  }
  getData() {
    return {
      calls: this.calls,
      controller: this.controller.controllerValue,
      headers: this.controller.headers,
      self_headers: this.action.request.headers
    };
  }
}

@JsonController("data")
export class DataController {
  constructor(private log: LogService, private swagger: SpecBuilder, private dep: FirstService) {
  }
  controllerValue: number = 0;
  headers: any;
  @Get('logs/:id/:test')
  @FilterBrokers(b => b.name === 'private')
  public getLogInfo(@QueryParam('test', { required: false }) test: number,
    @Param('id') id: number,
    @Header("Authorization") auth: string,
    @Param('test') testParam: string) {
    return { testParam, id }
  }

  @Get("logger")
  public async getLogger(@Headers() headers: any) {
    this.log.calls++;
    this.controllerValue = 100;
    this.headers = headers;
    return this.log.getData();
    // return {count: this.log.calls};
  }

  @Get('swagger')
  getSwagger() {
    return this.swagger.getDocument();
  }

  @Get(':name')
  public async getData(@Body() body: any) {
    console.dir(body, { depth: null });
    return { ok: true, body };
  }

  @Post(':name')
  @BrokerRouteOptions(b => {
    return {
      payload: {
        parse: false
      }
    }
  })
  public async postData(@Param('name') name: string, @Body() body: any) {
    console.log("BODY", body);
    return "get data called"
  }

  @Post('custom')
  public async customCall(@Body({ required: true, validate: true }) body: TestValdiator) {
    return "custom call called"
  }

  @Post('slow-route', { queueOptions: { consumeOptions: { noAck: true } } })
  public async slowRoute() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ ok: true });
      }, 1 * 5 * 1000);
    });
  }

}
