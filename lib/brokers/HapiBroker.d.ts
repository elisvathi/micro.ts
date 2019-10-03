import { AbstractBroker } from './AbstractBroker';
import { RouteMapper, RequestMapper } from './IBroker';
export declare class HapiBroker extends AbstractBroker {
    private options;
    private server;
    constructor(options: {
        address: string;
        port: number;
    });
    protected routeMapper: RouteMapper;
    protected requestMapper: RequestMapper;
    private registerRoutes;
    start(): Promise<void>;
}
