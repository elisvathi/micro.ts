import { JsonController, Get, Controller, Post, Body, Headers, CurrentUser, ContainerInject, Patch, Delete, Put} from "./decorators/BaseDecorators";
import { BaseServer } from "./server/BaseServer";
import { Container } from "./di/BaseContainer";
import { HapiBroker } from "./brokers/IBroker";

@Controller()
export class Startup {
    constructor(a: string){}

    @Post()
    getData(){
    }
}

@JsonController({path: 'Voluum'})
export class VoluumController{
    @Get()
    public async trafficSources(){
        return [];
    }

    @Get()
    public async trackerView(){
        return {};
    }
}

@JsonController({path: "test"})
export class Program {

    constructor(private a: string, private b: Startup) {
    }

    @Delete({path: 'testing'})
    async testDelete(val: number){
    }

    @Get()
    async getCampaigns(){}

    @Put({path: 'testing'})
    async testPut(val: number){
    }

    @Patch()
    async testPatch(val: number){
    }

    @Post({path: 'testing'})
    async testPost(val: number){
    }

    @Get({path: 'test'})
    async testMethod(@Headers() val: number,
         @Body({required: true, validate: true}) v: string,
         @CurrentUser({required: true}) test: Startup,
         @ContainerInject() t: number): Promise<void> {
    }

}
Container.set('hapiOptions', {address: '0.0.0.0', port: 8080});
const hapi = Container.get(HapiBroker);
const server = new BaseServer({controllers: [VoluumController, Program]});
server.buildRoutes();
hapi.start().catch(console.log);
