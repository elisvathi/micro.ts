import { ServiceOptions, Container, InjectOptions } from "./BaseContainer";

export function Service(options?: ServiceOptions) {
    return (target: any) => {
        const constructorArgs = Reflect.getOwnMetadata('design:injectparamtypes', target) || [];
        options = options || {};
        options.ctorParams = constructorArgs;
        Container.registerService(target, options);
    }
}

export function Inject(options: InjectOptions) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        let ctorMetadata = Reflect.getOwnMetadata('desing:injectparamtypes', target);
        if (!ctorMetadata) {
            const constructorArgs = Reflect.getOwnMetadata('design:paramtypes', target) || [];
            ctorMetadata = constructorArgs.map((x: any) => {
                return { type: x };
            });
        }
        ctorMetadata[parameterIndex].injectOptions = options;
        Reflect.defineMetadata('design:injectparamtypes', ctorMetadata, target);
    }
}
