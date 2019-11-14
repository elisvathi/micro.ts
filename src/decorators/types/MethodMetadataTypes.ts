import { ParamDescription } from "./ParamMetadataTypes";
import { AppMiddleware } from "../..";
import { AppErrorHandler } from "../../errors";
import { QueueOptions } from "../../server";
import { IBroker } from "../../brokers/IBroker";
import { TransformerClass } from "../../transformers/types";
export type BrokerFilter = (broker: IBroker) => boolean;
export type TransformerDefinition  = {transformer: TransformerClass, options?: any[]}
export interface MethodDescription {
  name?: string;
  metadata?: MethodOptions;
  params: ParamDescription[];
  authorize?: boolean;
  authorization?: AuthorizeOptions;
  middlewares?: MiddlewareOptions[];
  errorHandlers?: AppErrorHandler[];
}

export interface MethodOptions {
  method?: string;
  path?: string;
  brokers?: BrokerFilter;
  encoder?: TransformerDefinition,
  decoder?: TransformerDefinition,
  queueOptions?: QueueOptions;
  timeout?: number;
}

export interface ControllerOptions {
  json?: boolean;
  path?: string;
  encoder?: TransformerDefinition,
  decoder?: TransformerDefinition,
  brokersFilter?: BrokerFilter;
  authorize?: boolean;
  authorization?: AuthorizeOptions;
  middlewares?: MiddlewareOptions[];
  errorHandlers?: AppErrorHandler[];
  timeout?: number;
}

export interface MethodControllerOptions {
  method: MethodDescription;
  controller: ControllerOptions;
}

export interface MiddlewareOptions {
  before?: boolean;
  middleware: AppMiddleware;
}

export interface ErrorHandlerOptions { }

export interface AuthorizeOptions {
  [key: string]: any;
}
