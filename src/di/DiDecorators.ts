import { ServiceOptions, Container } from "./BaseContainer";

/**
 * Provide custom configuration (transient, or scoped)  for a service to register it in the DI container
 * @param options
 */
export function Service(options?: ServiceOptions) {
    return (target: any) => {
        let constructorArgs = Reflect.getOwnMetadata('design:injectparamtypes', target);
        if(!constructorArgs){
            const paramTypes = Reflect.getOwnMetadata('design:paramtypes', target) || [];
            constructorArgs = paramTypes.map(x=>{
                return {type: x};
            });
            Reflect.defineMetadata('design:injectparamtypes', constructorArgs, target);
        }
        options = options || {};
        options.ctorParams = constructorArgs;
        Container.registerService(target, options);
    }
}

/**
 * Decorator is used in constructor arguments, for services of app controllers
 * @param key
 */
export function Inject(key?: any) {
    return (target: any, _propertyKey: string, parameterIndex: number) => {
        let ctorMetadata = Reflect.getOwnMetadata('desing:injectparamtypes', target);
        if (!ctorMetadata) {
            const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
            ctorMetadata = constructorArgs.map((x: any) => {
                return { type: x };
            });
        }
        ctorMetadata[parameterIndex].injectOptions = {key: key || ctorMetadata[parameterIndex].type};
        Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
    }
}
