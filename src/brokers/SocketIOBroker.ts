import { AbstractBroker } from "./AbstractBroker";
import Socket, { Server as SocketServer } from 'socket.io';
import * as http from 'http';
import { RouteMapper, RequestMapper } from "./IBroker";
import { BaseRouteDefinition, Action } from "../server/types";

export interface SocketIOPayload {

}

export class SocketIOBroker extends AbstractBroker {
    private readonly server!: SocketServer;
    constructor(listener: http.Server) {
        super();
        this.server = Socket(listener);
    }

    public getConnection(): SocketServer {
        return this.server;
    }

    protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
        let basePart: string = def.base;
        if (basePart.indexOf("/") !== 0) {
            basePart = `/${basePart}`;
        }
        let controllerPart = def.controller;
        if (controllerPart.indexOf("/") !== 0) {
            controllerPart = `/${controllerPart}`;
        }
        let handlerPart = def.handler;
        if (handlerPart.indexOf("/") !== 0 && handlerPart.length > 0) {
            handlerPart = `/${handlerPart}`;
        }
        return `${basePart}${controllerPart}${handlerPart}`.replace("//", "/");
    };

    public onDisconnected(cb: (action: Action)=>any){
    }

    protected requestMapper: RequestMapper = (clientId: string, query: any, headers: any, body: any, path: string, socket: Socket.Socket) => {
        const act: Action = {
            request: {
                params: {},
                path,
                headers: {...headers, socket_id: clientId},
                method: 'get',
                body,
                qs: query,
                raw: { clientId, query, body, headers, path },
            },
            connection: socket
        };
        return act;
    };

    /**
     * Start listening
     */
    async start() {
        this.server.on('connection', (socket) => {
            const clientId = socket.client.id;
            const query = socket.handshake.query;
            const headers = socket.handshake.headers;
            console.log(clientId, query, headers);
            this.registeredRoutes.forEach((defs, key) => {
                socket.on(key, async (body) => {
                    const action: Action = this.requestMapper(clientId, query, headers, body, key, socket);
                    const handler = this.actionToRouteMapper(key, action, defs);
                    const response = await handler(action);
                    socket.emit(key, response.response);
                });
            });
        });
    }
}
