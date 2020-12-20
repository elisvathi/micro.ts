import { Class } from "../server";
import { ServiceOptions } from "./types";
import { ServiceScope } from "./types/DiOptionsTypes";

export class RegistryToken<T> {
  constructor(public name?: string) { }
}

export type RegistryKey<T = any> = Class<T> | RegistryToken<T> | string;
export type ResolverFunction<T = any> = () => T;
export type ResolverRegistryItem<T = any> = { resolver: ResolverFunction<T>, scope: ServiceScope }

export class DiRegistry {

  private serviceOptions: Map<RegistryKey, ServiceOptions> = new Map();

  private resolvers: Map<RegistryKey, ResolverRegistryItem> = new Map();

  public bind(key: RegistryKey, options: ServiceOptions) {
    this.serviceOptions.set(key, options);
  }

  public bindResolver<T>(key: RegistryKey<T | string>, resolver: ResolverFunction<T>, scope: ServiceScope = ServiceScope.Singleton) {
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
