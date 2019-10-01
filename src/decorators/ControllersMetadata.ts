import { AuthorizeOptions, ErrorHandlerOptions, ControllerOptions, ParamOptions, MethodOptions, MiddlewareOptions } from './BaseDecorators';

export interface ParamMetadata {

}

export interface ParamDescription{
    type: any;
    options?: ParamOptions;
}
export type ControllerHandlers = {[key: string]: MethodDescription}

export interface MethodDescription{
    name? : string;
    metadata? : MethodOptions;
    params : ParamDescription[];
    authorization? : AuthorizeOptions;
    middlewares? : MiddlewareOptions[];
    errorHandlers? : ErrorHandlerOptions[];
}

export interface ControllerMetadata{
    name: string;
    ctor: any;
    options?: ControllerOptions;
    constructorParams?: ParamDescription[];
    handlers?: ControllerHandlers;
}

export interface GlobalMetadata{
    controllers: Map<any, ControllerMetadata>;
    methods: Map<any, {[key:string]: MethodDescription}>;
    parameters: Map<any, {[key:string]: (ParamDescription | null)[]}>;
}

const metadata: GlobalMetadata = {
    controllers : new Map<any, ControllerMetadata>(),
    methods : new Map<any, {[key: string]: MethodDescription}>(),
    parameters : new Map<any, {[key: string]: (ParamDescription | null)[]}>(),
};

export function getGlobalMetadata() {
    return metadata;
}

export function printMetadata(){
    console.dir(metadata, {depth: null});
}
