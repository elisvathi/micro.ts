export interface IErrorData extends Partial<Error> {
  statusCode: number;
  code: string;
  message: string;
  data?: any;
  stackTrace?: string[]
}

export function errorToObject(error: IErrorData, stack: boolean = false): IErrorData {
  const payload: IErrorData = {
    statusCode: error.statusCode || 500,
    code: error.code || "internal_server_error",
    message: error.message || "Internal server error",
    data: error.data,
  }
  if (stack && error.stack) {
    payload.stackTrace = error.stack.split("\n").slice(1).map(x => x.trim());
  }
  return payload;
}
export class MainAppError extends Error {
  constructor() {
    super();
  }
  statusCode!: number;
  code!: string;
  message!: string;
  data?: any;
  toObject(): IErrorData {
    return { statusCode: this.statusCode, message: this.message, data: this.data, stack: this.stack, code: this.code }
  }
}
export class DecoderError extends MainAppError {
  constructor(public data?: any) {
    super();
    this.statusCode = 400;
    this.code = "invalid_format";
  }
}

export class EncoderError extends MainAppError {
  constructor(public data?: any) {
    super();
    this.statusCode = 400;
    this.code = "invalid_format";
  }
}

export class ServerError extends MainAppError {
  constructor(public message: string = "Internal Server Error", public data?: any) {
    super();
    this.statusCode = 500;
    this.code = "internal_server_error";
  }
}

export class BadRequest extends MainAppError {
  constructor(public message: string = "Bad Request", public data?: any) {
    super();
    this.statusCode = 400;
    this.code = "bad_request";
  }
}

export class NotAuthorized extends MainAppError {
  constructor(public message: string = "Not authorized", public data?: any) {
    super();
    this.statusCode = 401;
    this.code = "unauthorized";
  }
}

export class Forbidden extends MainAppError {
  constructor(public message: string = "Forbidden", public data?: any) {
    super();
    this.statusCode = 301;
    this.code = "forbidden";
  }
}

export class NotFound extends MainAppError {
  constructor(public message: string = "Path not found", public data?: any) {
    super();
    this.statusCode = 404;
    this.code = "not_found";
  }
}
export class TimeoutError extends MainAppError {
  constructor(public message: string = "Request timeout", public data?: any, public stack?: any) {
    super();
    this.statusCode = 408;
    this.code = "timeout";
  }
}
