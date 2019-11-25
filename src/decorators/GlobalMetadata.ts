import { GlobalMetadata, ControllerMetadata, ControllerHandlers } from "./types/ControllerMetadataTypes";
import { MethodDescription, MethodControllerOptions, ControllerOptions } from "./types/MethodMetadataTypes";
import { ParamDescription } from "./types/ParamMetadataTypes";

const metadata: GlobalMetadata = {
    // Filled after the controller decorators are executed
    controllers: new Map<any, ControllerMetadata>(),
    // Used to keep all method decorators, reused after every controller decorator executed
    methods: new Map<any, { [key: string]: MethodDescription }>(),
    // USed to keep all parameter decorators, reused after every execution of method decorators
    parameters: new Map<any, { [key: string]: (ParamDescription | null)[] }>(),
};

/**
 * Get the global metadata object
 */
export function getGlobalMetadata() {
    return metadata;
}

export function printMetadata() {
    console.dir(metadata, { depth: null });
}

/**
 * Return metadata for the method and the controller that contains it 
 * @param ctor Controller constructor passed as a value
 * @param methodName Name of the method
 */
export function getHandlerMetadata(ctor: any, methodName: string): MethodControllerOptions {
    let ctorMetadata = metadata.controllers.get(ctor);
    if (!ctorMetadata) {
        const methodDesc: MethodDescription = { name: methodName, params: [] };
        const controllerOptions: ControllerOptions = {};
        return { method: methodDesc, controller: controllerOptions };
    }
    const handlers: ControllerHandlers = (ctorMetadata as ControllerMetadata).handlers || {};
    const methodDescription = handlers[methodName];
    const controllerDescription = ctorMetadata.options;
    return { method: methodDescription, controller: controllerDescription || {} };
}
