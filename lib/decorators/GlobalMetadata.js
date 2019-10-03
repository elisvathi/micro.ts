"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metadata = {
    controllers: new Map(),
    methods: new Map(),
    parameters: new Map(),
};
function getGlobalMetadata() {
    return metadata;
}
exports.getGlobalMetadata = getGlobalMetadata;
function printMetadata() {
    console.dir(metadata, { depth: null });
}
exports.printMetadata = printMetadata;
function getHandlerMetadata(ctor, methodName) {
    let ctorMetadata = metadata.controllers.get(ctor);
    if (!ctorMetadata) {
        const methodDesc = { name: methodName, params: [] };
        const controllerOptions = {};
        return { method: methodDesc, controller: controllerOptions };
    }
    const handlers = ctorMetadata.handlers || {};
    const methodDescription = handlers[methodName];
    const controllerDescription = ctorMetadata.options;
    return { method: methodDescription, controller: controllerDescription || {} };
}
exports.getHandlerMetadata = getHandlerMetadata;
//# sourceMappingURL=GlobalMetadata.js.map