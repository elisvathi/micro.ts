import { ServiceOptions } from '.';
import { Class } from '..';
import {
	ContainerRegistry,
	RegistryKey,
	ResolverRegistryItem,
	DiRegistry,
} from './DiRegistry';
import { InjectOptions, ServiceScope } from './types/DiOptionsTypes';

/**
 * Container Module is a scoped dependency resolver and container,
 * The module is used to manage the main container dependencies,
 * also the request scoped dependencies
 * A new module is created when calling Container.newModule
 * using the current container module as the parent of the new module
 * therefore treating the newly created module as request scoped
 */
export class ContainerModule {
	/**
	 * If a parent is provided, this module is a scoped module,
	 * meaning for singleton scoped dependencies it will fall back to the parent module
	 * @param registyr
	 * @param parent
	 */
	constructor(
		private registry: DiRegistry = ContainerRegistry,
		private parent?: ContainerModule
	) {
		this.set(ContainerModule, this);
	}

	/**
	 * Key value to store the resolved dependencies if they match the module scope
	 */
	private instances: Map<RegistryKey, any> = new Map();

	/**
	 * Return true only if it has a parent
	 */
	private get isScoped(): boolean {
		return !!this.parent;
	}

	/**
	 * Construct an object with its constructor,
	 * using the information it has from the constructor metadata
	 * If not in transient scope store the created value
	 * @param ctor
	 * @param keyMetadata
	 */
	private buildValue<T>(ctor: Class<T>, keyMetadata: ServiceOptions): T {
		// Fetch the constructor metadata
		const ctorParams =
			(keyMetadata.ctorParams as {
				type: any;
				injectOptions: InjectOptions;
			}[]) || [];
		/**
		 * Build or fetch each constructor argument using the modules's get method
		 */
		const args = ctorParams.map((x) => {
			if (x.injectOptions) {
				return this.get(x.injectOptions.key);
			}
			return this.get(x.type);
		});
		/**
		 * Create the object
		 */
		const value = new ctor(...args);
		/**
		 * Check if the value should be stored
		 */
		if (keyMetadata.scope !== ServiceScope.Transient) {
			this.instances.set(ctor, value);
		}
		return value;
	}

	/**
	 * Resolve with the resolver and store the value if not transient scoped
	 * @param key
	 * @param resolveItem
	 */
	private resolve<T>(
		key: RegistryKey,
		resolveItem: ResolverRegistryItem<T>
	): T {
		const value = resolveItem.resolver(this);
		if (resolveItem.scope !== ServiceScope.Transient) {
			this.instances.set(key, value);
		}
		return value;
	}

	/**
	 * Return true if this module is scoped and the required scope is singleton scope
	 * Throws error if this module is not scoped and the required scope is request scoped
	 * @param scope
	 */
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

	/**
	 * Set an arbitrary value for the given key
	 * @param key
	 * @param value
	 */
	public set<T>(key: RegistryKey<T>, value: T) {
		this.instances.set(key, value);
	}

	/**
	 * Try and resolve the value
	 * Might return undefined if it doesn't find
	 * the stored key and/or cannot construct the value
	 * @param key
	 */
	public get<T = any>(key: RegistryKey): T {
		/**
		 * Check if module contains an instance
		 */
		const existing = this.instances.get(key);
		/**
		 * Exists in own instances
		 */
		if (existing) {
			return existing;
		}
		/**
		 * Check for resolvers
		 */
		if (this.registry.hasResolver(key)) {
			/**
			 * Get resolver info and function from the registry
			 */
			const resolveItem = this.registry.getResolver(key);
			/**
			 * Check if the parent should create the resolver
			 */
			if (this.useParentScope(resolveItem.scope)) {
				return this.parent?.get(key) as T;
			}
			/**
			 * If not resolve dhe dependency
			 */
			return this.resolve(key, resolveItem);
		}
		if (typeof key === 'function') {
			/**
			 * Doesn't exist in own instances
			 */
			let keyMetadata = this.registry.getMetadata(key);
			if (!keyMetadata) {
				/**
				 * Initialize metadata and call this method again
				 */
				keyMetadata = this.registry.initializeMetadata(key);
			}
			/**
			 * Check if parent should provide this dependency
			 */
			if (this.useParentScope(keyMetadata.scope || ServiceScope.Singleton)) {
				return this.parent?.get(key) as T;
			}
			/**
			 * Construct the value
			 */
			return this.buildValue<T>(key as Class<T>, keyMetadata);
		}
		return (undefined as unknown) as T;
	}
}
