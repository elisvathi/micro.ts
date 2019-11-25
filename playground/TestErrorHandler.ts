import { Action, BaseRouteDefinition, IErrorHandler } from "../src";
import { IBroker } from "../src/brokers/IBroker";

export class TestErrorHandler implements IErrorHandler {
  do(error: any, action: Action, _def?: BaseRouteDefinition, _controller?: any, _broker?: IBroker<any>): boolean | Promise<boolean> {
    action.response = action.response || {};
    action.response.statusCode = error.statusCode || 500;
    action.response.body = { ok: false, data: error }
    return true;
  }
}
