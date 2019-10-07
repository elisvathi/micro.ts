import { BaseServer, BaseRouteDefinition } from "./server";
import { IBroker, HapiBroker, AmqpBroker, SocketIOBroker } from "./brokers";
import { ParamDescription } from "./decorators";

function getBrokerInfo(broker: IBroker){
    const result: any = {};
    if(broker.constructor === HapiBroker){
        result.type = 'http';
        const con = (broker as HapiBroker).getConnection();
        result.info = con.listener.address();
    }else if(broker.constructor === AmqpBroker){
        result.type = 'amqp';
        const conn = (broker as AmqpBroker).getConnection();
        result.info = conn.serverProperties;
    }else if(broker.constructor === SocketIOBroker){
        result.type = 'socket.io'
        const conn = (broker as SocketIOBroker).getConnection();
        result.info = conn.path()
    }
    return result;
}
export function serializeRoute(route: string, def: BaseRouteDefinition, params: ParamDescription[]){
    return {route, def, params}
}
export function serializeServer(server: BaseServer) {
    const data = server.serverInfo;
    const totalResults: any[] = [];
    data.forEach((item, key)=>{
        totalResults.push({broker: getBrokerInfo(key), paths: item.map(x=>{
        })});
    });
    return totalResults;
}

