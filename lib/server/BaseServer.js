"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const GlobalMetadata_1 = require("../decorators/GlobalMetadata");
const BaseContainer_1 = require("../di/BaseContainer");
const MainAppErrror_1 = require("../errors/MainAppErrror");
const ParamMetadataTypes_1 = require("../decorators/types/ParamMetadataTypes");
class BaseServer {
    constructor(options) {
        this.options = options;
        this.brokers = [];
    }
    addBroker(broker) {
        this.brokers.push(broker);
    }
    get controllersMetadata() {
        return GlobalMetadata_1.getGlobalMetadata();
    }
    async executeMiddleware(middleware, def, action, controller) {
        if ('do' in middleware) {
            const casted = middleware;
            return casted.do(action, def, controller);
        }
        return middleware(action, def, controller);
    }
    async executeErrorHandler(handler, error, action, def, controller, broker) {
        if ('do' in handler) {
            const casted = handler;
            return casted.do(error, action, def, controller, broker);
        }
        return handler(error, action, def, controller, broker);
    }
    async handleError(handlers, error, action, def, controllerInstance, broker) {
        for (let i = 0; i < handlers.length; i++) {
            const result = await this.executeErrorHandler(handlers[i], error, action, def, controllerInstance, broker);
            if (result === true) {
                return true;
            }
        }
        return false;
    }
    async executeRequest(def, action, broker) {
        const controllerInstance = BaseContainer_1.Container.get(def.controllerCtor);
        const methodControllerMetadata = GlobalMetadata_1.getHandlerMetadata(def.controllerCtor, def.handlerName);
        try {
            action = await this.handleRequest(def, action, broker, controllerInstance, methodControllerMetadata);
        }
        catch (err) {
            const errorHandlers = this.getErrorHandlers(methodControllerMetadata);
            const handled = await this.handleError(errorHandlers, err, action, def, controllerInstance, broker);
            if (!handled) {
                action.response = action.response || {};
                action.response.statusCode = err.statusCode || 500;
                action.response.is_error = true;
                action.response.error = err;
            }
        }
        if (this.options.logRequests) {
            const response = action.response || {};
            const statusCode = response.statusCode || 200;
            console.log(chalk_1.default.greenBright(`[${broker.constructor.name}]`), chalk_1.default.blueBright(`[${def.method.toUpperCase()}]`), chalk_1.default.green(`[${def.controller}]`), chalk_1.default.yellow(`[${def.handlerName}]`), `${action.request.path}`, statusCode === 200 ? chalk_1.default.blue(`[${statusCode}]`) : chalk_1.default.red(`[${statusCode}]`));
        }
        return action;
    }
    async checkAuthorization(action, methodMetadata) {
        let shouldCheck = false;
        if (methodMetadata.controller.authorize) {
            shouldCheck = true;
        }
        if (methodMetadata.method.authorize === false) {
            shouldCheck = false;
        }
        else if (methodMetadata.method.authorize === true) {
            shouldCheck = true;
        }
        if (shouldCheck && this.options.authorizationChecker) {
            const options = methodMetadata.method.authorization || methodMetadata.controller.authorization || {};
            const authorized = await this.options.authorizationChecker(action, options);
            if (!authorized) {
                throw new MainAppErrror_1.NotAuthorized("You are not authorized to make this request");
            }
        }
    }
    groupMiddlewares(middlewares) {
        const result = { before: [], after: [] };
        middlewares.forEach(m => {
            if (m.before) {
                result.before.push(m.middleware);
            }
            else {
                result.after.push(m.middleware);
            }
        });
        return result;
    }
    getMiddlewares(methodMetadata) {
        const middlewares = { before: [], after: [] };
        let afterMiddlewares = [];
        if (this.options.beforeMiddlewares && this.options.beforeMiddlewares.length > 0) {
            middlewares.before.push(...this.options.beforeMiddlewares);
        }
        if (this.options.afterMiddlewares && this.options.afterMiddlewares.length > 0) {
            afterMiddlewares.push(this.options.afterMiddlewares);
        }
        if (methodMetadata.controller.middlewares && methodMetadata.controller.middlewares.length > 0) {
            const groupedControllerMiddlewares = this.groupMiddlewares(methodMetadata.controller.middlewares);
            middlewares.before.push(...groupedControllerMiddlewares.before);
            afterMiddlewares.push(groupedControllerMiddlewares.after);
        }
        if (methodMetadata.method.middlewares && methodMetadata.method.middlewares.length > 0) {
            const groupedMethodMiddleware = this.groupMiddlewares(methodMetadata.method.middlewares);
            middlewares.before.push(...groupedMethodMiddleware.before);
            afterMiddlewares.push(groupedMethodMiddleware.after);
        }
        // Reverse after middlewares so they go in the order of 1. Handler Middlewares, 2. Controller Middlewares, 3. Global Middlewares
        afterMiddlewares = afterMiddlewares.reverse();
        afterMiddlewares.forEach(a => {
            middlewares.after.push(...a);
        });
        return middlewares;
    }
    getErrorHandlers(methodMetadata) {
        const result = [];
        result.push(...methodMetadata.method.errorHandlers || []);
        result.push(...methodMetadata.controller.errorHandlers || []);
        result.push(...this.options.errorHandlers || []);
        return result;
    }
    async handleRequest(def, action, broker, controllerInstance, methodControllerMetadata) {
        await this.checkAuthorization(action, methodControllerMetadata);
        const middlewares = this.getMiddlewares(methodControllerMetadata);
        if (middlewares.before.length) {
            for (let i = 0; i < middlewares.before.length; i++) {
                action = await this.executeMiddleware(middlewares.before[i], def, action, controllerInstance);
            }
        }
        const args = await this.buildParams(action, methodControllerMetadata.method, broker);
        let result = await controllerInstance[def.handlerName](...args);
        action.response = action.response || {};
        action.response.headers = action.response.headers || {};
        action.response.statusCode = 200;
        action.response.body = result;
        if (middlewares.after.length) {
            for (let i = 0; i < middlewares.after.length; i++) {
                action = await this.executeMiddleware(middlewares.after[i], def, action, controllerInstance);
            }
        }
        return action;
    }
    async buildParams(action, metadata, broker) {
        return Promise.all(metadata.params.map(async (p) => {
            return this.buildSingleParam(action, p, broker);
        }));
    }
    async getUser(action) {
        if (!this.options.currentUserChecker) {
            return null;
        }
        return this.options.currentUserChecker(action);
    }
    async validateParam(value, required, validate, name, type) {
        if (required && !value) {
            throw new MainAppErrror_1.BadRequest(`${name} is required`);
        }
        if (validate && !!value && this.options.validateFunction) {
            try {
                const result = await this.options.validateFunction(value, type);
                return result || value;
            }
            catch (err) {
                throw new MainAppErrror_1.BadRequest("One or more errors with your request", err.details || err.message || err);
            }
        }
        return value;
    }
    /**
     * Switches through all the cases of param types and maps the correct information
     * @param action
     * @param metadata
     * @param broker
     */
    async buildSingleParam(action, metadata, broker) {
        if (!metadata.options) {
            return action.request.body || action.request.qs || {};
        }
        else {
            const options = metadata.options;
            switch (options.decoratorType) {
                case ParamMetadataTypes_1.ParamDecoratorType.Body:
                    const body = action.request.body;
                    return this.validateParam(body, options.bodyOptions.required || false, options.bodyOptions.validate || false, 'body', metadata.type);
                case ParamMetadataTypes_1.ParamDecoratorType.BodyField:
                    const bodyField = action.request.body[options.name];
                    return this.validateParam(bodyField, options.bodyParamOptions.required || false, false, options.name);
                case ParamMetadataTypes_1.ParamDecoratorType.Params:
                    const params = action.request.params;
                    return this.validateParam(params, true, options.paramOptions.validate || false, 'parameters', metadata.type);
                case ParamMetadataTypes_1.ParamDecoratorType.ParamField:
                    const paramField = action.request.params[options.name];
                    return this.validateParam(paramField, true, false, options.name);
                case ParamMetadataTypes_1.ParamDecoratorType.Method:
                    return action.request.method;
                case ParamMetadataTypes_1.ParamDecoratorType.Connection:
                    return action.connection;
                case ParamMetadataTypes_1.ParamDecoratorType.Request:
                    return action;
                case ParamMetadataTypes_1.ParamDecoratorType.RawRequest:
                    return action.request.raw;
                case ParamMetadataTypes_1.ParamDecoratorType.ContainerInject:
                    return BaseContainer_1.Container.get(options.name);
                case ParamMetadataTypes_1.ParamDecoratorType.Broker:
                    return broker;
                case ParamMetadataTypes_1.ParamDecoratorType.Header:
                    const headers = action.request.headers;
                    return this.validateParam(headers, options.headerOptions.validate || false, false, 'headers', metadata.type);
                case ParamMetadataTypes_1.ParamDecoratorType.HeaderField:
                    const headerParam = action.request.headers[options.name];
                    return this.validateParam(headerParam, options.headerParamOptions.required || false, false, options.name);
                case ParamMetadataTypes_1.ParamDecoratorType.Query:
                    const query = action.request.qs;
                    return this.validateParam(query, options.queryOptions.required || false, options.queryOptions.validate || false, 'query', metadata.type);
                case ParamMetadataTypes_1.ParamDecoratorType.QueryField:
                    const queryParam = action.request.qs[options.name];
                    return this.validateParam(queryParam, options.queryParamOptions.required || false, false, options.name);
                case ParamMetadataTypes_1.ParamDecoratorType.User:
                    const user = await this.getUser(action);
                    const required = options.currentUserOptions.required || false;
                    if (required && !user) {
                        throw new MainAppErrror_1.NotAuthorized("You are not authorized to access this resource");
                    }
                    return user;
            }
        }
    }
    addRoute(def) {
        if (this.options.brokers) {
            this.options.brokers.forEach((broker) => {
                broker.addRoute(def, (action) => {
                    return this.executeRequest(def, action, broker);
                });
            });
        }
    }
    async start() {
        this.buildRoutes();
        if (this.options.brokers) {
            await Promise.all(this.options.brokers.map(async (x) => {
                await x.start();
            }));
            console.log("SERVER STARTED");
        }
    }
    buildRoutes() {
        let controllers = this.controllersMetadata.controllers;
        const routes = [];
        const basePath = this.options.basePath || "";
        controllers.forEach((c) => {
            if (this.options.controllers.includes(c.ctor)) {
                const name = c.name;
                let options = c.options;
                options = options || {};
                const cPath = options.path;
                const isJon = options.json;
                const controllerPath = cPath || name;
                const handlers = c.handlers;
                Object.keys(handlers).forEach((key) => {
                    const methodName = key;
                    const methodPath = c.handlers[key].metadata.path;
                    const path = methodPath || methodName;
                    const reqMethod = c.handlers[key].metadata.method;
                    const routeDefinition = {
                        base: basePath,
                        controller: controllerPath,
                        controllerCtor: c.ctor,
                        handler: path,
                        handlerName: methodName,
                        method: reqMethod,
                        consumers: c.handlers[key].metadata.consumers,
                        json: isJon
                    };
                    this.addRoute(routeDefinition);
                    routes.push({ method: reqMethod.toUpperCase(), path: `${basePath}/${controllerPath}/${path}` });
                });
            }
        });
        console.table(routes);
    }
}
exports.BaseServer = BaseServer;
