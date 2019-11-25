export interface ParamMetadata {

}

export interface ParamDescription {
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
  headerParamOptions?: RequestHeaderParamOptions;

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
  notEmpty?: boolean;
}

export interface RequestBodyParamOptions {
  required?: boolean;
}

export interface RequestHeaderOptions {
  required?: boolean;
  notEmpty?: boolean;
  validate?: boolean;
}

export interface RequestHeaderParamOptions {
  required?: boolean;
}

export interface RequestParamsOptions {
  validate?: boolean;
}

export interface RequestSingleParamOptions {
}

export interface RequestQueryOptions {
  required?: boolean;
  validate?: boolean;
  notEmpty?: boolean;
}

export interface RequestQueryParamOptions {
  required?: boolean;
}

export interface CurrentUserOptions {
  required?: boolean;
}

export interface ContainerInjectOptions {
}
