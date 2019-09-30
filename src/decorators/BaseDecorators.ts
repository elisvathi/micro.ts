import { IMiddleware, MiddlewareFunction } from "../middlewares/IMiddleware";
import { getGlobalMetadata, ControllerMetadata, MethodDescription, ParamDescription } from "./ControllersMetadata";
import 'reflect-metadata';
import { Service } from "../di/DiDecorators";

export interface ControllerOptions {
    json?: boolean;
    path?: string;
    brokers?: any[];
}

export interface MethodOptions {
    method?: string;
    path?: string;
    brokers?: any[];
}

export enum ParamDecoratorType {
    User = "User",

    Body = "Body",
    BodyField = "BodyField",

    Header = "Headers",
    HeaderField = "HeaderField",

    Query = "Query",
    QueryField = "QueryField",
    Request = "Request",
    RawRequest = "RawRequest",
    ContainerInject ="ContainerInject",
    Connection = "Connection",
    Method = "Method",
    Params = "Params",
    ParamField = "ParamField"
}
export interface ParamOptions {
    name?: any;

    bodyOptions?: RequestBodyOptions;
    bodyParamOptions?: RequestBodyParamOptions;

    headerOptions?: RequestHeaderOptions;
    headerParamOptiosn?: RequestHeaderParamOptions;

    queryOptions?: RequestQueryOptions;
    queryParamOptions?: RequestQueryParamOptions;

    paramOptions?: RequestParamsOptions;
    singleParamOptions?: RequestSingleParamOptions;

    currentUserOptions?: CurrentUserOptions;
    containerInjectOptions?: ContainerInjectOptions;
    decoratorType: ParamDecoratorType;
}

export interface RequestBodyOptions {
    validate?: boolean;
    required?: boolean;
}
export interface RequestBodyParamOptions { }

export interface MiddlewareOptions {
    before?: boolean
    middleware: IMiddleware | MiddlewareFunction;
}

export interface ErrorHandlerOptions { }

export interface AuthorizeOptions { }

export interface RequestHeaderOptions { }

export interface RequestHeaderParamOptions { }

export interface RequestParamsOptions { }

export interface RequestSingleParamOptions { }

export interface RequestQueryOptions { }

export interface RequestQueryParamOptions { }

export interface CurrentUserOptions {
    required?: boolean;
}
export interface ContainerInjectOptions {
}

export interface Action {
    qs?: any;
    method?: any;
    path?: any;
    headers?: any;
    params? : any;
    body?: any;
    raw?: any;
    connection?: any;
}

function registerControllerMetadata(target: any, options?: ControllerOptions) {
    Reflect.decorate([Service({ transient: true })], target);
    const metadata = getGlobalMetadata();
    metadata.controllers = metadata.controllers || [];
    const name: string = target.name;
    // let found = metadata.controllers.find(x => x.ctor === target);
    let found: ControllerMetadata | undefined = metadata.controllers.get(target);
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target);

    found = found || { name, ctor: target };
    found.constructorParams = [];
    if (paramtypes && paramtypes.length) {
        found.constructorParams.push(...paramtypes.map(x => { return { type: x } }));
    }

    found.options = options;
    found.handlers = metadata.methods.get(target.prototype);
    metadata.methods.delete(target.prototype);
    metadata.controllers.set(target, found);
}

function registerHandlerMetadata(target: any, propertyKey: string, descriptor: PropertyDescriptor, options: MethodOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: MethodDescription } = metadata.methods.get(target) as { [key: string]: MethodDescription };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || { params: [] };
    controller[propertyKey].name = propertyKey;
    controller[propertyKey].metadata = options;
    controller[propertyKey].params = [];
    const existingParams = metadata.parameters.get(target);
    if (existingParams && existingParams[propertyKey]) {
        controller[propertyKey].params = existingParams[propertyKey] as ParamDescription[];
    } else {
        const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
        if (paramtypes && paramtypes.length) {
            controller[propertyKey].params.push(...paramtypes.map(x => { return { type: x } }));
        }
    }
    metadata.parameters.delete(target);
    metadata.methods.set(target, controller);
}

function registerParamMetadata(target: any, propertyKey: string, index: number, options?: ParamOptions) {
    const metadata = getGlobalMetadata();
    let controller: { [key: string]: ParamDescription[] } = metadata.parameters.get(target) as { [key: string]: ParamDescription[] };
    controller = controller || {};
    controller[propertyKey] = controller[propertyKey] || [];
    const paramtypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target, propertyKey);
    if (paramtypes && paramtypes.length > 0 && controller[propertyKey].length === 0) {
        controller[propertyKey].push(...paramtypes.map(x => { return { type: x } }));
    }
    controller[propertyKey][index].options = options;
    metadata.parameters.set(target, controller);
}

function attachHandlerAuthorization(target: any, propertykey: string, descriptor: PropertyDescriptor, options?: AuthorizeOptions) {
}

function attachHandlerMiddleware(target: any, propertyKey: string, descriptor: PropertyDescriptor, options: MiddlewareOptions) {

}

function attachHandlerErrorHandler(target: any, propertyKey: string, descriptor: PropertyDescriptor, options: ErrorHandlerOptions) {

}

export function Controller(options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        registerControllerMetadata(target, options);
    }
}

export function JsonController(path: string, options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        options.json = true;
        options.path = path;
        registerControllerMetadata(target, options);
    }
}

export function Get(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {}
        options.method = 'get';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Post(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'post';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Put(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'put';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Patch(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'patch';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Delete(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'delete';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}
export function Authorize(options?: AuthorizeOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerAuthorization(target, propertyKey, descriptor, options);
    }
}

export function Body(options?: RequestBodyOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Body,
            bodyOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

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

export function Params(options?: RequestParamsOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.Params,
            paramOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

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
            headerParamOptiosn: options || {},
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

export function Connection() {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Connection };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function CurrentUser(options?: CurrentUserOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = {
            decoratorType: ParamDecoratorType.User,
            currentUserOptions: options || {}
        };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

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

export function UseMiddleware(options: MiddlewareOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerMiddleware(target, propertyKey, descriptor, options);
    }
}

export function UseErrorHandler(options: ErrorHandlerOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        attachHandlerErrorHandler(target, propertyKey, descriptor, options);
    }
}
