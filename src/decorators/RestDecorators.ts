import { MethodOptions } from './types/MethodMetadataTypes';
import { registerHandlerMetadata } from './BaseDecorators';

function registerHandlerVerb(
	verb: string,
	path?: string,
	options?: MethodOptions
): MethodDecorator {
	return ((
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): void => {
		options = options || {};
		options.method = verb;
		options.path = path;
		registerHandlerMetadata(target, propertyKey, descriptor, options);
	}) as MethodDecorator;
}

export function Get(path?: string, options?: MethodOptions): MethodDecorator {
	return registerHandlerVerb('get', path, options) as MethodDecorator;
}

export function Post(path?: string, options?: MethodOptions): MethodDecorator {
	return registerHandlerVerb('post', path, options) as MethodDecorator;
}

export function Put(path?: string, options?: MethodOptions): MethodDecorator {
	return registerHandlerVerb('put', path, options) as MethodDecorator;
}

export function Options(
	path?: string,
	options?: MethodOptions
): MethodDecorator {
	return registerHandlerVerb('options', path, options) as MethodDecorator;
}

export function Patch(path?: string, options?: MethodOptions): MethodDecorator {
	return registerHandlerVerb('patch', path, options) as MethodDecorator;
}

export function Delete(
	path?: string,
	options?: MethodOptions
): MethodDecorator {
	return registerHandlerVerb('delete', path, options) as MethodDecorator;
}
