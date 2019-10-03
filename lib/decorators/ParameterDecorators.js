"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParamMetadataTypes_1 = require("./types/ParamMetadataTypes");
const BaseDecorators_1 = require("./BaseDecorators");
function Body(options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Body,
            bodyOptions: options || {}
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Body = Body;
function BodyParam(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.BodyField,
            bodyParamOptions: options || {},
            name
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.BodyParam = BodyParam;
function Param(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.ParamField,
            singleParamOptions: options || {},
            name
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Param = Param;
function Params(options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Params,
            paramOptions: options || {}
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Params = Params;
function Query(options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Query,
            queryOptions: options || {}
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Query = Query;
function QueryParam(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.QueryField,
            queryParamOptions: options || {},
            name
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.QueryParam = QueryParam;
function Headers(options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Header,
            headerOptions: options || {}
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Headers = Headers;
function Header(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.HeaderField,
            headerParamOptions: options || {},
            name
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Header = Header;
function Request() {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = { decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Request };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Request = Request;
function RawRequest() {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = { decoratorType: ParamMetadataTypes_1.ParamDecoratorType.RawRequest };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.RawRequest = RawRequest;
function Method() {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = { decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Method };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Method = Method;
function Broker() {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = { decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Broker };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Broker = Broker;
/**
 * Injects the broker connection in the method parameter it decorates
 */
function Connection() {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = { decoratorType: ParamMetadataTypes_1.ParamDecoratorType.Connection };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.Connection = Connection;
/**
 * currentUserChecker function is called and its result gets injected on the method parameter
 * @param options
 */
function CurrentUser(options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.User,
            currentUserOptions: options || {}
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.CurrentUser = CurrentUser;
/**
 * Specifies that the current handler parameter will be injected from the DI container
 * @param name
 * @param options
 */
function ContainerInject(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const newOptions = {
            decoratorType: ParamMetadataTypes_1.ParamDecoratorType.ContainerInject,
            containerInjectOptions: options || {},
            name
        };
        BaseDecorators_1.registerParamMetadata(target, propertyKey, parameterIndex, newOptions);
    };
}
exports.ContainerInject = ContainerInject;
