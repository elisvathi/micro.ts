import {
    RequestBodyOptions,
    ParamOptions,
    ParamDecoratorType,
    RequestBodyParamOptions,
    RequestSingleParamOptions,
    RequestParamsOptions,
    RequestQueryOptions,
    RequestQueryParamOptions,
    RequestHeaderOptions,
    RequestHeaderParamOptions,
    CurrentUserOptions,
    ContainerInjectOptions
} from "./types/ParamMetadataTypes";
import { registerParamMetadata } from "./BaseDecorators";

/**
 * Injects the Action request body to the handler 
 * @param options options to validate the parameter
 */
export function Body(options?: RequestBodyOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Body,
            bodyOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Injects a single value using the given key on the Action request body root level 
 * @param name Key of the body object to inject
 * @param options Specify if the field is required 
 */
export function BodyParam(name: string, options?: RequestBodyParamOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.BodyField,
            bodyParamOptions: options || {},
            name
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Injects a single value using the given key on the Action request params root level 
 * @param name Key of the param object to inject
 * @param options Specify if the field is required 
 */
export function Param(name: string, options?: RequestSingleParamOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.ParamField,
            singleParamOptions: options || {},
            name
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Inject params value of the Action object on the handler
 * @param options Specify if  params object needs to be validated
 */
export function Params(options?: RequestParamsOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Params,
            paramOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Inject query object of the Action object on the handler
 * @param options Specify if the query object needs to be validated, or required if it should absolutely exist
 */
export function Query(options?: RequestQueryOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Query,
            queryOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function QueryParam(name: string, options?: RequestQueryParamOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.QueryField,
            queryParamOptions: options || {},
            name
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Headers(options?: RequestHeaderOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Header,
            headerOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Header(name: string, options?: RequestHeaderParamOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.HeaderField,
            headerParamOptions: options || {},
            name
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Request() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Request };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}
export function RawRequest() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.RawRequest };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Method() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Method };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Broker() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Broker };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Injects the broker connection in the method parameter it decorates
 */
export function Connection() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Connection };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * currentUserChecker function is called and its result gets injected on the method parameter 
 * @param options
 */
export function CurrentUser(options?: CurrentUserOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.User,
            currentUserOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

/**
 * Specifies that the current handler parameter will be injected from the DI container 
 * @param name
 * @param options
 */
export function ContainerInject(name?: any, options?: ContainerInjectOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.ContainerInject,
            containerInjectOptions: options || {},
            name
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}
