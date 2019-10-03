"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
class BaseContainer {
    constructor() {
        this.serviceOptions = new Map();
        this.singletonInstances = new Map();
        this.scopes = {};
    }
    registerService(type, options) {
        this.serviceOptions.set(type, options);
    }
    set(key, value) {
        this.singletonInstances.set(key, value);
    }
    get(key, scope) {
        if (typeof key === 'string') {
            if (scope) {
                return this.scopes[scope].get(key);
            }
            return this.singletonInstances.get(key);
        }
        let serviceOptions = this.serviceOptions.get(key);
        if (!serviceOptions) {
            const constructorArgs = Reflect.getOwnMetadata('design:injectparamtypes', key) || [];
            const options = {};
            options.ctorParams = constructorArgs;
            this.registerService(key, options);
            serviceOptions = this.serviceOptions.get(key);
        }
        const ctorParams = serviceOptions.ctorParams;
        const args = ctorParams.map(x => {
            if (x.injectOptions) {
                return this.get(x.injectOptions.key, serviceOptions.scope);
            }
            return this.get(x.type, serviceOptions.scope);
        });
        let value;
        if (!!serviceOptions.scope || !!scope) {
            if (!!serviceOptions.scope && !!scope && scope !== serviceOptions.scope) {
                value = this.singletonInstances.get(key);
            }
            else {
                let sc = (serviceOptions.scope || scope);
                value = this.scopes[sc].get(key);
            }
        }
        else {
            value = this.singletonInstances.get(key);
        }
        if (!value) {
            value = new key(...args);
            if (!serviceOptions.transient && !serviceOptions.scope) {
                this.singletonInstances.set(key, value);
            }
            else if (serviceOptions.scope) {
                this.scopes[serviceOptions.scope].set(key, value);
            }
        }
        return value;
    }
}
exports.BaseContainer = BaseContainer;
exports.Container = new BaseContainer();
function printContainer() {
    console.dir(exports.Container, { depth: null });
}
exports.printContainer = printContainer;
//# sourceMappingURL=BaseContainer.js.map