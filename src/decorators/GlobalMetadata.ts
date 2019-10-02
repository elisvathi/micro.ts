import { GlobalMetadata, ControllerMetadata, ControllerHandlers } from "./types/ControllerMetadataTypes";
import { MethodDescription, MethodControllerOptions, ControllerOptions } from "./types/MethodMetadataTypes";
import { ParamDescription } from "./types/ParamMetadataTypes";

const metadata: GlobalMetadata = {
    controllers: new Map<any, ControllerMetadata>(),
    methods: new Map<any, { [key: string]: MethodDescription }>(),
    parameters: new Map<any, { [key: string]: (ParamDescription | null)[] }>(),
};

export function getGlobalMetadata() {
    return metadata;
}

export function printMetadata() {
    console.dir(metadata, { depth: null });
}

export function getHandlerMetadata(ctor: any, methodName: string): MethodControllerOptions {
    let ctorMetadata = metadata.controllers.get(ctor);
    if (!ctorMetadata) {
        const methodDesc: MethodDescription = { name: methodName, params: [] };
        const controllerOptions: ControllerOptions = {};
        return {method: methodDesc, controller: controllerOptions};
    }
    const handlers: ControllerHandlers = (ctorMetadata as ControllerMetadata).handlers || {};
    const methodDescription =  handlers[methodName];
    const controllerDescription = ctorMetadata.options;
    return {method: methodDescription, controller: controllerDescription || {}};
}
