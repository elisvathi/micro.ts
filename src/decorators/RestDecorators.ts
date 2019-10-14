import { MethodOptions } from "./types/MethodMetadataTypes";
import { registerHandlerMetadata } from "./BaseDecorators";

export function Get(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {}
        options.method = 'get';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Post(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'post';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Put(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'put';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Options(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'options';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Patch(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'patch';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}

export function Delete(options?: MethodOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        options = options || {};
        options.method = 'delete';
        registerHandlerMetadata(target, propertyKey, descriptor, options);
    }
}
