export class MainAppError {
  statusCode!: number;
  code!: string;
  message!: string;
  stack?: any;
  data?: any;
}

export class ServerError extends MainAppError {
  constructor(message: string = "Internal Server Error", data?: any, stack?: any) {
    super();
    this.message = message;
    this.statusCode = 500;
    this.stack = stack;
    this.data = data;
    this.code = "internal_server_error";
  }
}

export class BadRequest extends MainAppError {
  constructor(message: string = "Bad Request", data?: any, stack?: any) {
    super();
    this.statusCode = 400;
    this.data = data;
    this.message = message;
    this.code = "bad_request";
    this.stack = stack;
  }
}

export class NotAuthorized extends MainAppError {
  constructor(message: string = "Not authorized", data?: any, stack?: any) {
    super();
    this.statusCode = 401;
    this.data = data;
    this.message = message;
    this.code = "unauthorized";
    this.stack = stack;
  }
}

export class Forbidden extends MainAppError {
  constructor(message: string = "Forbidden", data?: any, stack?: any) {
    super();
    this.statusCode = 403;
    this.data = data;
    this.message = message;
    this.code = "forbidden";
    this.stack = stack;
  }
}

export class NotFound extends MainAppError {
  constructor(message: string = "Path not found", data?: any, stack?: any) {
    super();
    this.statusCode = 404;
    this.data = data;
    this.message = message;
    this.code = "not_found";
    this.stack = stack;
  }
}
export class TimeoutError extends MainAppError {
  constructor(public message: string = "Request timeout", public data?: any, public stack?: any) {
    super();
    this.statusCode = 408;
    this.code = "timeout";
  }
}
