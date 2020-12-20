import { ServiceOptions } from '.';
import { Class } from '..';
import {
  ContainerRegistry,
  RegistryKey,
  ResolverRegistryItem,
} from './DiRegistry';
import { InjectOptions, ServiceScope } from './types/DiOptionsTypes';

export class ContainerModule {
  constructor(private parent?: ContainerModule) { }

  private instances: Map<RegistryKey, any> = new Map();

  private get isScoped(): boolean {
    return !!this.parent;
  }

  private buildValue<T>(ctor: Class<T>, keyMetadata: ServiceOptions): T {
    const ctorParams =
      (keyMetadata.ctorParams as {
        type: any;
        injectOptions: InjectOptions;
      }[]) || [];
    const args = ctorParams.map((x) => {
      if (x.injectOptions) {
        return this.get(x.injectOptions.key);
      }
      return this.get(x.type);
    });
    const value = new ctor(...args);
    if (keyMetadata.scope !== ServiceScope.Transient) {
      this.instances.set(ctor, value);
    }
    return value;
  }

  private resolve<T>(
    key: RegistryKey,
    resolveItem: ResolverRegistryItem<T>
  ): T {
    const value = resolveItem.resolver();
    if (resolveItem.scope !== ServiceScope.Transient) {
      this.instances.set(key, value);
    }
    return value;
  }

  private useParentScope(scope: ServiceScope): boolean {
    if (this.isScoped && scope === ServiceScope.Singleton) {
      return true;
    } else if (scope === ServiceScope.Request && !this.isScoped) {
      throw new Error(
        'Can not inject a scoped dependency in a singleton dependency'
      );
    }
    return false;
  }

	public set<T>(key: RegistryKey<T>, value: T){
		this.instances.set(key, value);
	}

  public get<T = any>(key: RegistryKey): T | undefined {
    // Check if module contains an instance
    const existing = this.instances.get(key);
    // Exists in own instances
    if (existing) {
      return existing;
    }
    // Check for resolvers
    if (ContainerRegistry.hasResolver(key)) {
      const resolveItem = ContainerRegistry.getResolver(key);
      if (this.useParentScope(resolveItem.scope)) {
        return this.parent?.get(key);
      }
      return this.resolve(key, resolveItem);
    }
    if (typeof key === "function") {
      // Doesn't exist in own instances
      const keyMetadata = ContainerRegistry.getMetadata(key);
      if (!keyMetadata) {
        // Initialize metadata and call this method again
        ContainerRegistry.initalizeMetadata(key);
        return this.get<T>(key);
      }
      if (this.useParentScope(keyMetadata.scope || ServiceScope.Singleton)) {
        return this.parent?.get(key);
      }
      return this.buildValue<T>(key as Class<T>, keyMetadata);
    }
  }
}
