import 'reflect-metadata';
import { Class } from '../server/types';
import { ContainerModule } from './ContainerModule';
import { ContainerRegistry, ResolverFunction, DiRegistry } from './DiRegistry';
import { ServiceOptions } from './types';
import { ServiceScope } from './types/DiOptionsTypes';

export class BaseContainer {
	constructor(private registry: DiRegistry = ContainerRegistry) {
	}

	private root: ContainerModule = new ContainerModule();

	/**
	 * Bind a Class constructor to the container
	 * @param type
	 * @param options
	 */
	public registerService(type: any, options: ServiceOptions) {
		this.registry.bind(type, options);
	}

	public newModule(): ContainerModule {
		return new ContainerModule(this.root);
	}

	/**
	 * Bind a resolver function to a specific key
	 * @param key
	 * @param resolver
	 */
	public bindResolver(
		key: any,
		resolver: ResolverFunction<any>,
		scope: ServiceScope = ServiceScope.Transient
	) {
		this.registry.bindResolver(key, resolver, scope);
	}

	public hasResolver(key: any) {
		return this.registry.hasResolver(key);
	}

	/**
	 * Explicitly set a value to the container in global scope
	 * @param key
	 * @param value
	 */
	public set(key: any, value: any) {
		this.root.set(key, value);
	}

	/**
	 * Get the instance from the container,
	 * if it does not exist, create a new instance
	 * @param key Key or Class constructor of the instance
	 * @param scope Scope of the instance
	 */
	public get<T = any>(key: Class<T> | string | any): T {
		return this.root.get(key);
	}
}

export const Container = new BaseContainer();

export function printContainer() {
	console.dir(Container, { depth: null });
}
