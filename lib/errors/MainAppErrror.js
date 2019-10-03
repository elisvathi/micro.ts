"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MainAppError {
}
exports.MainAppError = MainAppError;
class ServerError extends MainAppError {
    constructor(message = "Internal Server Error", data, stack) {
        super();
        this.message = message;
        this.statusCode = 500;
        this.stack = stack;
        this.data = data;
        this.code = "internal_server_error";
    }
}
exports.ServerError = ServerError;
class BadRequest extends MainAppError {
    constructor(message = "Bad Request", data, stack) {
        super();
        this.statusCode = 400;
        this.data = data;
        this.message = message;
        this.code = "bad_request";
        this.stack = stack;
    }
}
exports.BadRequest = BadRequest;
class NotAuthorized extends MainAppError {
    constructor(message = "Not authorized", data, stack) {
        super();
        this.statusCode = 401;
        this.data = data;
        this.message = message;
        this.code = "unauthorized";
        this.stack = stack;
    }
}
exports.NotAuthorized = NotAuthorized;
class Forbidden extends MainAppError {
    constructor(message = "Forbidden", data, stack) {
        super();
        this.statusCode = 301;
        this.data = data;
        this.message = message;
        this.code = "forbidden";
        this.stack = stack;
    }
}
exports.Forbidden = Forbidden;
class NotFound extends MainAppError {
    constructor(message = "Path not found", data, stack) {
        super();
        this.statusCode = 404;
        this.data = data;
        this.message = message;
        this.code = "not_found";
        this.stack = stack;
    }
}
exports.NotFound = NotFound;
