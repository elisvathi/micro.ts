import { IBroker } from "../../brokers/IBroker";
import { IMiddleware, MiddlewareFunction } from "../../middlewares/IMiddleware";
import { Action } from "./BaseTypes";
import { AuthorizeOptions } from "../../decorators/types/MethodMetadataTypes";

export interface ServerOptions {
    basePath?: string;
    controllers: any[];
    brokers?: IBroker[];
    dev?: boolean;
    logRequests?: boolean;
    beforeMiddlewares?: (IMiddleware | MiddlewareFunction)[];
    afterMiddlewares?: (IMiddleware | MiddlewareFunction)[];
    errorHandlers?: any[];
    currentUserChecker?: (action: Action) => any;
    authorizationChecker?: (action: Action, options: AuthorizeOptions) => boolean | Promise<boolean>;
}
