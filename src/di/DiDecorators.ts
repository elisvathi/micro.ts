import { ServiceOptions } from "./types";
import { Container } from "./BaseContainer";

/**
 * Provide custom configuration (transient, or scoped)  for a service to register it in the DI container
 * @param options
 */
export function Service(options?: ServiceOptions) {
  return (target: any) => {
    let constructorArgs = getInjectParamTypes(target);
    if (!constructorArgs) {
      const paramTypes = getConstructorParams(target);
      constructorArgs = paramTypes.map((x: any) => {
        return { type: x };
      });
      Reflect.defineMetadata('design:injectparamtypes', constructorArgs, target);
    }
    options = options || {};
    options.ctorParams = constructorArgs;
    Container.registerService(target, options);
  }
}

/**
 * Get constructor parameters even in constructor less services
 * @param target
 */
export function getConstructorParams(target: any): any[] {
  const paramTypes: any[] = Reflect.getOwnMetadata('design:paramtypes', target) || [];
  if (paramTypes.length === 0) {
    const superClass = Object.getPrototypeOf(target);
    if (!!superClass && superClass !== Object) {
      return getConstructorParams(superClass);
    }
    return [];
  }
  return paramTypes;
}

/**
 * Get Inject param types even in constructor less services
 * @param target
 */
export function getInjectParamTypes(target: any): any[] {
  const paramTypes: any[] = Reflect.getOwnMetadata('design:injectparamtypes', target);
  if (!paramTypes) {
    const superClass = Object.getPrototypeOf(target);
    if (!!superClass && superClass !== Object) {
      const returnValue = getInjectParamTypes(superClass);
      return returnValue;
    }
  }
  return paramTypes;
}

/**
 * Decorator is used in constructor arguments, for services of app controllers
 * @param key
 */
export function Inject(key?: any) {
  return (target: any, _propertyKey: string, parameterIndex: number) => {
    let ctorMetadata = getInjectParamTypes(target);
    if (!ctorMetadata) {
      const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
      ctorMetadata = constructorArgs.map((x: any) => {
        return { type: x };
      });
    }
    ctorMetadata[parameterIndex].injectOptions = { key: key || ctorMetadata[parameterIndex].type };
    Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
  }
}
