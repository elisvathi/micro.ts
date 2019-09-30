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
    User,
    Body,
    Header,
    HeaderField,
    BodyField,
    Query,
    QueryField,
    Request,
    RawRequest,
    ContainerInject,
    Connection,
}
export interface ParamOptions {
    bodyOptions?: BodyOptions;
    headerOptions?: HeaderOptions;
    currentUserOptions?: CurrentUserOptions;
    containerInjectOptions?: ContainerInjectOptions;
    decoratorType: ParamDecoratorType;
}

export interface BodyOptions {
    validate?: boolean;
    required?: boolean;
}
export interface BodyFieldOptions{}

export interface MiddlewareOptions {
    before?: boolean
    middleware: IMiddleware | MiddlewareFunction;
}

export interface ErrorHandlerOptions {
}

export interface AuthorizeOptions {
}

export interface HeaderOptions {
}

export interface SingleHeaderOptions {
}

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
    body?: any;
    raw?: any;
    connection? :any;
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

export function JsonController(options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        options.json = true;
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

export function Body(options?: BodyOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Body, bodyOptions: options || {} };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}
export function BodyParam(name: string) {
}

export function Param(name: string) {
}

export function Params() {
}
export function Query() {
}
export function QueryParam() {
}

export function Headers(options?: HeaderOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.Header, headerOptions: options || {} };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function Header(name: string){}

export function Request(){
}
export function RawRequest(){}

export function Method(){}

export function CurrentUser(options?: CurrentUserOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.User, currentUserOptions: options || {} };
        registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    }
}

export function ContainerInject(options?: ContainerInjectOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const newOptions: ParamOptions = { decoratorType: ParamDecoratorType.ContainerInject, containerInjectOptions: options || {} };
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
