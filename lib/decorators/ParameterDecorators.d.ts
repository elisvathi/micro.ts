import { RequestBodyOptions, RequestBodyParamOptions, RequestSingleParamOptions, RequestParamsOptions, RequestQueryOptions, RequestQueryParamOptions, RequestHeaderOptions, RequestHeaderParamOptions, CurrentUserOptions, ContainerInjectOptions } from "./types/ParamMetadataTypes";
export declare function Body(options?: RequestBodyOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function BodyParam(name: string, options?: RequestBodyParamOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Param(name: string, options?: RequestSingleParamOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Params(options?: RequestParamsOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Query(options?: RequestQueryOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function QueryParam(name: string, options?: RequestQueryParamOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Headers(options?: RequestHeaderOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Header(name: string, options?: RequestHeaderParamOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Request(): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function RawRequest(): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Method(): (target: any, propertyKey: string, parameterIndex: number) => void;
export declare function Broker(): (target: any, propertyKey: string, parameterIndex: number) => void;
/**
 * Injects the broker connection in the method parameter it decorates
 */
export declare function Connection(): (target: any, propertyKey: string, parameterIndex: number) => void;
/**
 * currentUserChecker function is called and its result gets injected on the method parameter
 * @param options
 */
export declare function CurrentUser(options?: CurrentUserOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
/**
 * Specifies that the current handler parameter will be injected from the DI container
 * @param name
 * @param options
 */
export declare function ContainerInject(name?: any, options?: ContainerInjectOptions): (target: any, propertyKey: string, parameterIndex: number) => void;
