import { JsonController, Get, Controller, Post, Body, Headers, CurrentUser, ContainerInject, Patch, Delete, Put, RawRequest, Request, Header, Param, Params, BodyParam, Method, Connection, Query, QueryParam, Action, Authorize } from "./decorators/BaseDecorators";
import { BaseServer } from "./server/BaseServer";
import { Container } from "./di/BaseContainer";
import { HapiBroker } from "./brokers/IBroker";
import { printMetadata } from "./decorators/ControllersMetadata";
import { Service } from "./di/DiDecorators";
import { AmqpBroker } from "./brokers/AmqpBroker";

@Service()
class UserService {
    private data: any[] = [];

    getData() {
        return this.data;
    }

    setData(headers: any) {
        this.data.push(headers);
    }
}

@JsonController("Voluum")
export class VoluumController {

    @Get()
    public async trafficSources(@CurrentUser() user: any, @ContainerInject(UserService) serv: UserService, @Query() query: any, @Headers() headers: any) {
        return query;
    }

    @Get()
    public async trackerView() {
        return {};
    }

    @Post({path: "clear"})
    public async removeData(@Body({validate: true, required: false}) data: UserService){
        console.log("CALLED", JSON.parse(data.toString()));
        return {"Done": true};
    }

    @Delete({path: "clear-all"})
    public async removeAllData(){
    }

}
async function main(){
    Container.set("hapiOptions", { address: '0.0.0.0', port: 8080 });
    Container.set("amqpOptions", {url: "amqp://localhost"});
    Container.set(HapiBroker, "abc");
    const hapi = Container.get(HapiBroker);
    const amqp = Container.get(AmqpBroker);
    const server = new BaseServer({ controllers: [VoluumController],
                                    brokers: [hapi, amqp],
                                    basePath: '/api' ,
                                    currentUserChecker: (a: Action)=>{return a.headers}});
    await server.start();
}
main().catch(console.log);
