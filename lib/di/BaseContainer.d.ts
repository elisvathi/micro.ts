import 'reflect-metadata';
import { ServiceOptions } from './types/DiOptionsTypes';
export declare class BaseContainer {
    serviceOptions: Map<any, ServiceOptions>;
    singletonInstances: Map<any, any>;
    scopes: {
        [key: string]: Map<any, any>;
    };
    constructor();
    registerService(type: any, options: ServiceOptions): void;
    set(key: any, value: any): void;
    get<T>(key: {
        new (...args: any[]): T;
    } | string, scope?: string): T;
}
export declare const Container: BaseContainer;
export declare function printContainer(): void;
