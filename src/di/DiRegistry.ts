import { Class } from '../server';
import { ServiceOptions } from './types';
import { ServiceScope } from './types/DiOptionsTypes';
import { ContainerModule } from './ContainerModule';

export class RegistryToken<T> {
  constructor(public name?: string) { }
}

export type RegistryKey<T = any> = Class<T> | RegistryToken<T> | string;
export type ResolverFunction<T = any> = ((module: ContainerModule) => T) | (() => T);
export type ResolverRegistryItem<T = any> = {
  resolver: ResolverFunction<T>;
  scope: ServiceScope;
};

export class DiRegistry {
	/**
	 * Store service metadata
	 */
  private serviceOptions: Map<RegistryKey, ServiceOptions> = new Map();

	/**
	 * Store resolvers metadata and resolver functions
	 */
	private resolvers: Map<RegistryKey, ResolverRegistryItem> = new Map();

	/**
	 * Verify for circular dependencies
	 * @param key
	 * @param visited
	 */
  private verify(key: RegistryKey, visited: Map<RegistryKey, boolean> = new Map()) {
    if (typeof key === "string") {
      return;
    }
		if(visited.has(key)){
			throw new Error("Circular dependency");
		}
    visited.set(key, true);
    const metadata = this.getMetadata(key);
    if (!metadata) {
      this.initializeMetadata(key);
			this.verify(key);
    }
		const ctorParams = metadata?.ctorParams;
		if(ctorParams && ctorParams.length){
			for(const param of ctorParams){
				if(param.injectOptions){
					this.verify(param.injectOptions.key);
				}else{
					this.verify(param.type);
				}
			}
		}
  }

	/**
	 * Bind a key to a constructor function
	 * @param key
	 * @param options
	 */
  public bind(key: RegistryKey, options: ServiceOptions) {
    if (!options.scope) {
      options.scope = ServiceScope.Singleton;
    }
    this.serviceOptions.set(key, options);
    this.verify(key);
  }

	/**
	 * Bind a key to a given resolver function
	 * @param key
	 * @param resolver
	 * @param scope
	 */
  public bindResolver<T>(
    key: RegistryKey<T | string>,
    resolver: ResolverFunction<T>,
    scope: ServiceScope = ServiceScope.Transient
  ) {
    this.resolvers.set(key, { resolver, scope });
  }

	/**
	 * Check if a resolver exists for a given key
	 * @param key
	 */
  public hasResolver<T>(key: RegistryKey<T>): boolean {
    return this.resolvers.has(key);
  }

	/**
	 * Get stored metadata for a given key
	 * @param key
	 */
  public getMetadata<T>(key: RegistryKey<T>) {
    return this.serviceOptions.get(key);
  }

	/**
	 * Return resolver information and resolving function
	 * @param key
	 */
  public getResolver<T>(key: RegistryKey<T>): ResolverRegistryItem<T> {
    return this.resolvers.get(key) as ResolverRegistryItem;
  }

	/**
	 * Default metadata if they are not specified
	 * @param key
	 */
  public initializeMetadata<T>(key: RegistryKey<T | string>) {
    const constructorArgs =
      Reflect.getOwnMetadata('design:injectparamtypes', key) || [];
    const options: ServiceOptions = {};
    options.ctorParams = constructorArgs;
    this.bind(key, options);
  }
}

export const ContainerRegistry = new DiRegistry();
