"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseContainer_1 = require("./BaseContainer");
/**
 * Provide custom configuration (transient, or scoped)  for a service to register it in the DI container
 * @param options
 */
function Service(options) {
    return (target) => {
        let constructorArgs = Reflect.getOwnMetadata('design:injectparamtypes', target);
        if (!constructorArgs) {
            const paramTypes = Reflect.getOwnMetadata('design:paramtypes', target) || [];
            constructorArgs = paramTypes.map((x) => {
                return { type: x };
            });
            Reflect.defineMetadata('design:injectparamtypes', constructorArgs, target);
        }
        options = options || {};
        options.ctorParams = constructorArgs;
        BaseContainer_1.Container.registerService(target, options);
    };
}
exports.Service = Service;
/**
 * Decorator is used in constructor arguments, for services of app controllers
 * @param key
 */
function Inject(key) {
    return (target, _propertyKey, parameterIndex) => {
        let ctorMetadata = Reflect.getOwnMetadata('desing:injectparamtypes', target);
        if (!ctorMetadata) {
            const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
            ctorMetadata = constructorArgs.map((x) => {
                return { type: x };
            });
        }
        ctorMetadata[parameterIndex].injectOptions = { key: key || ctorMetadata[parameterIndex].type };
        Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
    };
}
exports.Inject = Inject;
//# sourceMappingURL=DiDecorators.js.map