"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDecorators_1 = require("./BaseDecorators");
function Get(options) {
    return (target, propertyKey, descriptor) => {
        options = options || {};
        options.method = 'get';
        BaseDecorators_1.registerHandlerMetadata(target, propertyKey, descriptor, options);
    };
}
exports.Get = Get;
function Post(options) {
    return (target, propertyKey, descriptor) => {
        options = options || {};
        options.method = 'post';
        BaseDecorators_1.registerHandlerMetadata(target, propertyKey, descriptor, options);
    };
}
exports.Post = Post;
function Put(options) {
    return (target, propertyKey, descriptor) => {
        options = options || {};
        options.method = 'put';
        BaseDecorators_1.registerHandlerMetadata(target, propertyKey, descriptor, options);
    };
}
exports.Put = Put;
function Patch(options) {
    return (target, propertyKey, descriptor) => {
        options = options || {};
        options.method = 'patch';
        BaseDecorators_1.registerHandlerMetadata(target, propertyKey, descriptor, options);
    };
}
exports.Patch = Patch;
function Delete(options) {
    return (target, propertyKey, descriptor) => {
        options = options || {};
        options.method = 'delete';
        BaseDecorators_1.registerHandlerMetadata(target, propertyKey, descriptor, options);
    };
}
exports.Delete = Delete;
