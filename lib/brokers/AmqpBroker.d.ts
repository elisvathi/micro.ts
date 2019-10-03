import { AbstractBroker } from "./AbstractBroker";
import { RequestMapper, RouteMapper } from "./IBroker";
export declare class AmqpBroker extends AbstractBroker {
    private options;
    private connection;
    private channel;
    constructor(options: {
        url: string;
    });
    protected requestMapper: RequestMapper;
    protected routeMapper: RouteMapper;
    private registerRoutes;
    private rpcReply;
    start(): Promise<void>;
}
