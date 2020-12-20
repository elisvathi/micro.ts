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
  private serviceOptions: Map<RegistryKey, ServiceOptions> = new Map();

  private resolvers: Map<RegistryKey, ResolverRegistryItem> = new Map();

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
      this.initalizeMetadata(key);
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

  public bind(key: RegistryKey, options: ServiceOptions) {
    if (!options.scope) {
      options.scope = ServiceScope.Singleton;
    }
    this.serviceOptions.set(key, options);
    this.verify(key);
  }

  public bindResolver<T>(
    key: RegistryKey<T | string>,
    resolver: ResolverFunction<T>,
    scope: ServiceScope = ServiceScope.Transient
  ) {
    this.resolvers.set(key, { resolver, scope });
  }

  public hasResolver<T>(key: RegistryKey<T>): boolean {
    return this.resolvers.has(key);
  }

  public getMetadata<T>(key: RegistryKey<T>) {
    return this.serviceOptions.get(key);
  }

  public getResolver<T>(key: RegistryKey<T>): ResolverRegistryItem<T> {
    return this.resolvers.get(key) as ResolverRegistryItem;
  }

  public initalizeMetadata<T>(key: RegistryKey<T | string>) {
    const constructorArgs =
      Reflect.getOwnMetadata('design:injectparamtypes', key) || [];
    const options: ServiceOptions = {};
    options.ctorParams = constructorArgs;
    this.bind(key, options);
  }
}

export const ContainerRegistry = new DiRegistry();
