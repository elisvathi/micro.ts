import { ControllerOptions, MiddlewareOptions, AuthorizeOptions, ErrorHandlerOptions } from "./types/MethodMetadataTypes";
import { registerControllerMetadata } from "./BaseDecorators";

export function Controller(options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        registerControllerMetadata(target, options);
    }
}

export function JsonController(path: string, options?: ControllerOptions) {
    return (target: any) => {
        options = options || {};
        options.json = true;
        options.path = path;
        registerControllerMetadata(target, options);
    }
}

export function ControllerMiddlewares(_options: MiddlewareOptions[]) {
    return (_target: any) => {
        throw new Error("Function not implemented");
    }
}

export function ControllerAuthorize(_options: AuthorizeOptions[]) {
    return (_target: any) => {
        throw new Error("Function not implemented");
    }
}

export function ControllerErrorHandlers(_options: ErrorHandlerOptions[]) {
    return (_target: any) => {
        throw new Error("Function not implemented");
    }
}
