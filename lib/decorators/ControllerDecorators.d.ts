import { ControllerOptions, AuthorizeOptions } from "./types/MethodMetadataTypes";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
import { AppMiddelware } from "../middlewares/IMiddleware";
export declare function Controller(options?: ControllerOptions): (target: any) => void;
export declare function JsonController(path: string, options?: ControllerOptions): (target: any) => void;
export declare function BeforeMiddlewares(options: AppMiddelware[]): (target: any) => void;
export declare function AfterMiddlewares(options: AppMiddelware[]): (target: any) => void;
export declare function ControllerAuthorize(options?: AuthorizeOptions): (target: any) => void;
export declare function ControllerErrorHandlers(options: AppErrorHandler[]): (target: any) => void;
