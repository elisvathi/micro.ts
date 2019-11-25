import { MethodOptions } from "./types/MethodMetadataTypes";
import { registerHandlerMetadata } from "./BaseDecorators";

function registerHandlerVerb(verb: string, path?: string, options?: MethodOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    options = options || {}
    options.method = verb;
    options.path = path;
    registerHandlerMetadata(target, propertyKey, descriptor, options);
  }
}

export function Get(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('get', path, options);
}

export function Post(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('post', path, options);
}

export function Put(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('put', path, options);
}

export function Options(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('options', path, options);
}

export function Patch(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('patch', path, options);
}

export function Delete(path?: string, options?: MethodOptions) {
  return registerHandlerVerb('delete', path, options);
}
