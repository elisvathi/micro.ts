import { MethodOptions } from "./types/MethodMetadataTypes";
import { registerHandlerMetadata } from "./BaseDecorators";

export function Get(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {}
        options.method = 'get';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Post(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'post';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Put(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'put';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Options(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'options';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Patch(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'patch';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Delete(path?: string, options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'delete';
        options.path = path;
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}
