import { AuthorizeOptions, MiddlewareOptions } from "./types/MethodMetadataTypes";
import { AppErrorHandler } from "../errors/types/ErrorHandlerTypes";
export declare function Authorize(options?: AuthorizeOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function AllowAnonymous(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * Registers middlewares for the handler it decorates
 * @param options
 */
export declare function UseMiddlewares(options: MiddlewareOptions[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * Register error handler for the handler it decorates
 * @param options
 */
export declare function UseErrorHandler(options: AppErrorHandler[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
