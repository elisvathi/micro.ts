import 'reflect-metadata';
import { ServiceOptions, InjectOptions } from './types/DiOptionsTypes';

export class BaseContainer {
    serviceOptions: Map<any, ServiceOptions> = new Map<any, ServiceOptions>();
    singletonInstances: Map<any, any> = new Map<any, any>();
    scopes: { [key: string]: Map<any, any> } = {};

    constructor() {
    }

    registerService(type: any, options: ServiceOptions) {
        this.serviceOptions.set(type, options);
    }

    set(key: any, value: any) {
        this.singletonInstances.set(key, value);
    }

    get<T = any>(key: { new(...args: any[]): T } | string | any, scope?: string): T {
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

        const ctorParams = serviceOptions.ctorParams as { type: any, injectOptions: InjectOptions }[];
        const args = ctorParams.map(x => {
            if (x.injectOptions) {
                return this.get(x.injectOptions.key, serviceOptions.scope);
            }
            return this.get(x.type, serviceOptions.scope);
        });
        let value: any;
        if (!!serviceOptions.scope || !!scope) {
            if (!!serviceOptions.scope && !!scope && scope !== serviceOptions.scope) {
                value = this.singletonInstances.get(key);
            } else {
                let sc = (serviceOptions.scope || scope) as string;
                value = this.scopes[sc].get(key);
            }
        } else {
            value = this.singletonInstances.get(key);
        }
        if (!value) {
            value = new key(...args);
            if (!serviceOptions.transient && !serviceOptions.scope) {
                this.singletonInstances.set(key, value);
            } else if (serviceOptions.scope) {
                this.scopes[serviceOptions.scope].set(key, value);
            }
        }
        return value;
    }
}

export const Container = new BaseContainer();


export function printContainer() {
    console.dir(Container, { depth: null });
}


