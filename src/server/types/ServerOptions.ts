import { IBroker } from "../../brokers/IBroker";
import { AppMiddelware } from "../../middlewares/IMiddleware";
import { Action } from "./BaseTypes";
import { AuthorizeOptions } from "../../decorators/types/MethodMetadataTypes";
import { AppErrorHandler } from "../../errors/types/ErrorHandlerTypes";

export interface ServerOptions {
    basePath?: string;
    controllers: any[];
    brokers?: IBroker[];
    dev?: boolean;
    logRequests?: boolean;
    logErrors? : boolean;
    beforeMiddlewares?: AppMiddelware[];
    afterMiddlewares?: AppMiddelware[];
    errorHandlers?: AppErrorHandler[];
    currentUserChecker?: (action: Action, broker?: IBroker) => any;
    authorizationChecker?: (action: Action, options?: AuthorizeOptions) => boolean | Promise<boolean>;
    validateFunction?: (value: any, type: any) => any | Promise<any>;
}
