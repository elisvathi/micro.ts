import { GlobalMetadata } from "./types/ControllerMetadataTypes";
import { MethodControllerOptions } from "./types/MethodMetadataTypes";
export declare function getGlobalMetadata(): GlobalMetadata;
export declare function printMetadata(): void;
export declare function getHandlerMetadata(ctor: any, methodName: string): MethodControllerOptions;
