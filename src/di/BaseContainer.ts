import 'reflect-metadata';
import {ServiceOptions, InjectOptions} from './types';
import {Class} from "../server/types";
export type InstanceResolver<T> = (...args:any)=>T;
export class BaseContainer {
  private serviceOptions: Map<any, ServiceOptions> = new Map<any, ServiceOptions>();
  private scopes: { [key: string]: Map<any, any> } = {};
  /**
   * Get singleton scope
   */
  private get singletonInstances(): Map<any, any> {
    const singletonKey = '__singletons';
    return this.getScope(singletonKey);
  }

  /**
   * Get or create scope instances
   * @param scope
   */
  private getScope(scope: string){
    if(!this.scopes[scope]){
      this.scopes[scope] = new Map<any, any>();
    }
    return this.scopes[scope];
  }


  constructor() {
  }

  /**
   * Bind a Class constructor to the container
   * @param type
   * @param options
   */
  public registerService(type: any, options: ServiceOptions) {
    this.serviceOptions.set(type, options);
  }

  /**
   * Explicitly set a value to the container in global scope
   * @param key
   * @param value
   */
  public set(key: any, value: any) {
    this.singletonInstances.set(key, value);
  }

  /**
   * Explicitly set a value to the container in a custom scope
   * @param scope
   * @param key
   * @param value
   */
  public setScoped(scope: string, key: any, value: any) {
    if (!this.scopes[scope]) {
      this.scopes[scope] = new Map<any, any>();
    }
    this.scopes[scope].set(key, value);
  }

  /**
   * Get the instance from the container,
   * if it does not exist, create a new instance
   * @param key Key or Class constructor of the instance
   * @param scope Scope of the instance
   */
  public get<T = any>(key: Class<T> | string | any, scope?: string): T {
    if (typeof key === 'string') {
      if (scope) {
        return this.scopes[scope].get(key);
      }
      return this.singletonInstances.get(key);
    }

    let serviceOptions: ServiceOptions = this.serviceOptions.get(key) as ServiceOptions;
    if (!serviceOptions) {
      const constructorArgs = Reflect.getOwnMetadata('design:injectparamtypes', key) || [];
      const options: ServiceOptions = {};
      options.ctorParams = constructorArgs;
      this.registerService(key, options);
      serviceOptions = this.serviceOptions.get(key) as ServiceOptions;
    }

    let value: any;
    if (!!serviceOptions.scope || !!scope) {
      if (!!serviceOptions.scope && !!scope && scope !== serviceOptions.scope) {
        /**
         * Get from the singleton scope if scope not provided
         */
        value = this.singletonInstances.get(key);
      } else {
        let sc = (serviceOptions.scope || scope) as string;
        value = this.getScope(sc).get(key);
      }
    } else {
      value = this.singletonInstances.get(key);
    }
    /**
     * If value not found in any of the scopes, create the new value, and set it to the corresponding scope
     */
    if (!value) {
      /**
       * Get the constructor parameters metadata
       */
      const ctorParams = serviceOptions.ctorParams as { type: any, injectOptions: InjectOptions }[];
      /**
       * Build the constructor arguments
       */
      const args = ctorParams.map(x => {
        if (x.injectOptions) {
          return this.get(x.injectOptions.key, serviceOptions.scope);
        }
        return this.get(x.type, serviceOptions.scope);
      });
      value = new key(...args);
      if (!serviceOptions.transient && !serviceOptions.scope) {
        /**
         * Save the value to the singleton scope if scope not provided
         */
        this.singletonInstances.set(key, value);
      } else if (serviceOptions.scope) {
        /**
         * Save the value to the specified scope
         */
        this.getScope(serviceOptions.scope).set(key, value);
      }
    }
    return value;
  }
}

export const Container = new BaseContainer();

export function printContainer() {
  console.dir(Container, {depth: null});
}
