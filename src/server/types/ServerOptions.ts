import {IBroker} from "../../brokers/IBroker";
import {AppMiddleware} from "../../middlewares/IMiddleware";
import { Action, Class} from "./BaseTypes";
import {AuthorizeOptions} from "../../decorators/types/MethodMetadataTypes";
import {AppErrorHandler} from "../../errors/types/ErrorHandlerTypes";

export interface ServerOptions {
  /**
   * Base path for all the server endpoints
   */
  basePath?: string;
  /**
   * List of controller classes to be used by the server
   */
  controllers: Class<any>[];
  /**
   * List of the broker instances to be used by the server
   */
  brokers?: IBroker[];
  /**
   * Dev mode flag, enables full error stack response (WIP)
   */
  dev?: boolean;
  /**
   * Log formatted requests in the console
   */
  logRequests?: boolean;
  /**
   * Log server errors on the console
   */
  logErrors?: boolean;
  /**
   * App level before middlewares, exectued before any other middleware
   */
  beforeMiddlewares?: AppMiddleware[];
  /**
   * App level after middlewares, executed after the handler, handler's middlewares and controller middlewares
   */
  afterMiddlewares?: AppMiddleware[];
  /**
   * App level error handlers, executed if any thrown error has not been handled by the action's error handlers, and controller's error handlers
   */
  errorHandlers?: AppErrorHandler[];
  /**
   * Method to check for the current user of the request, the result inject if used @CurrentUser decorator on method params
   * @param action Action object
   * @param broker Broker instance
   */
  currentUserChecker?: (action: Action, broker?: IBroker) => any;
  /**
   * Called for every @Authorized handler or all the controller handlers, where the controller is decorated with @Authorized(),
   * and the method does not have @AllowAnonymous() decorator
   * @param action Action object
   * @param options Authorization options , the custom options specified in the @Authorized() decorator, are passed in this handler
   */
  authorizationChecker?: (action: Action, options?: AuthorizeOptions) => boolean | Promise<boolean>;
  /**
   * Function to validate the request components (body, headers, params, query) that have {validate: true}
   * The return value of this function, if it does not throw passes as a handler argument
   * @param value Value to validate
   * @param type Type of the value
   */
  validateFunction?: (value: any, type: any) => any | Promise<any>;
}
