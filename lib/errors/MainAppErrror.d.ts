export declare class MainAppError {
    statusCode: number;
    code: string;
    message: string;
    stack?: any;
    data?: any;
}
export declare class ServerError extends MainAppError {
    constructor(message?: string, data?: any, stack?: any);
}
export declare class BadRequest extends MainAppError {
    constructor(message?: string, data?: any, stack?: any);
}
export declare class NotAuthorized extends MainAppError {
    constructor(message?: string, data?: any, stack?: any);
}
export declare class Forbidden extends MainAppError {
    constructor(message?: string, data?: any, stack?: any);
}
export declare class NotFound extends MainAppError {
    constructor(message?: string, data?: any, stack?: any);
}
