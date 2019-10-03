import { ServerOptions } from './types/ServerOptions';
import { IBroker } from '../brokers/IBroker';
export declare class BaseServer {
    private options;
    constructor(options: ServerOptions);
    private brokers;
    addBroker(broker: IBroker): void;
    private readonly controllersMetadata;
    private executeMiddleware;
    private executeErrorHandler;
    private handleError;
    private executeRequest;
    private checkAuthorization;
    private groupMiddlewares;
    private getMiddlewares;
    private getErrorHandlers;
    private handleRequest;
    private buildParams;
    private getUser;
    private validateParam;
    /**
     * Switches through all the cases of param types and maps the correct information
     * @param action
     * @param metadata
     * @param broker
     */
    private buildSingleParam;
    private addRoute;
    start(): Promise<void>;
    buildRoutes(): void;
}
