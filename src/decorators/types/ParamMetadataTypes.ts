export interface ParamMetadata {

}

export interface ParamDescription{
    type: any;
    options?: ParamOptions;
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
    ContainerInject = "ContainerInject",
    Connection = "Connection",
    Broker = "Broker",

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
