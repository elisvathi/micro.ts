import { MethodOptions } from "./types/MethodMetadataTypes";
export declare function Get(options?: MethodOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Post(options?: MethodOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Put(options?: MethodOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Patch(options?: MethodOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function Delete(options?: MethodOptions): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
