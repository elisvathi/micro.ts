import { MethodDescription, ControllerOptions } from "./MethodMetadataTypes";
import { ParamDescription } from "./ParamMetadataTypes";
export declare type ControllerHandlers = {
    [key: string]: MethodDescription;
};
export interface ControllerMetadata {
    name: string;
    ctor: any;
    options?: ControllerOptions;
    constructorParams?: ParamDescription[];
    handlers?: ControllerHandlers;
}
export interface GlobalMetadata {
    controllers: Map<any, ControllerMetadata>;
    methods: Map<any, {
        [key: string]: MethodDescription;
    }>;
    parameters: Map<any, {
        [key: string]: (ParamDescription | null)[];
    }>;
}
