import {
	Action,
	Class,
	ServerOptions,
	BrokerConnectionErrorHandler,
} from "./types";
import {
	AppErrorHandler,
	AppMiddleware,
	AuthorizeOptions,
	Container,
} from "..";
import { IConfiguration } from "./IConfiguration";
import { IBroker } from "../brokers/IBroker";
import { ILogger, LoggerKey } from "./Logger";
import { BaseContainer } from "../di/BaseContainer";
import { MainAppError } from "../errors";
export type CurrentUserCheckerFunction<TUser> = (
	action: Action,
	broker?: IBroker
) => TUser | Promise<TUser>;
export type AuthorizationFunction = (
	action: Action,
	options?: AuthorizeOptions
) => boolean | Promise<boolean>;
export type GetNotAuthorizedErrorFuntion = (
	action: Action,
	options?: AuthorizeOptions
) => MainAppError | Promise<MainAppError>;
export type ValidateFunction = <T>(value: any, type: Class<T>) => Promise<T>;
export type StartupHook = () => Promise<void>;

export class OptionsBuilder {
	public beforeStartHooks: StartupHook[] = [];
	public afterStartHooks: StartupHook[] = [];
	constructor(
		public config: IConfiguration,
		private container: BaseContainer
	) {}
	public options: ServerOptions = {
		brokers: [],
		controllers: [],
		beforeMiddlewares: [],
		afterMiddlewares: [],
		errorHandlers: [],
	};

	public addBeforeStartHook(hook: StartupHook) {
		this.beforeStartHooks.push(hook);
	}

	public addAfterStartHook(hook: StartupHook) {
		this.afterStartHooks.push(hook);
	}

	/**
	 * Return the built options
	 */
	public get serverOptions(): ServerOptions {
		return this.options;
	}

	/**
	 * Enable or disable developer mode
	 * Returns the full error stack (Not yet implemented)
	 * @param val
	 */
	public setDevMode(val: boolean): OptionsBuilder {
		this.options.dev = val;
		return this;
	}

	/**
	 * Base path for all the endpoints
	 * @param val
	 */
	setBasePath(val: string): OptionsBuilder {
		this.options.basePath = val;
		return this;
	}

	/**
	 * Enable or disable request logging
	 * @param val
	 */
	public setLogRequests(val: boolean): OptionsBuilder {
		this.options.logRequests = val;
		return this;
	}

	/**
	 * Enable or disable server errors logging
	 * @param val
	 */
	public setLogErrors(val: boolean): OptionsBuilder {
		this.options.logErrors = val;
		return this;
	}

	/**
	 * Add a prebuilt broker
	 * @param broker
	 */
	public addBroker(broker: IBroker) {
		this.options.brokers!.push(broker);
	}

	/**
	 * Add a list of controllers to the server
	 * @param controllers
	 */
	public addControllers(...controllers: Class<any>[]): OptionsBuilder {
		this.options.controllers.push(...controllers);
		return this;
	}

	/**
	 * Add middlewares that get executed before any request handling, on all requests
	 * @param middlewares
	 */
	public addBeforeMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
		this.options.beforeMiddlewares!.push(...middlewares);
		return this;
	}

	/**
	 * Add middlewares that get executed after all successfully handled requests
	 * @param middlewares
	 */
	public addAfterMiddlewares(...middlewares: AppMiddleware[]): OptionsBuilder {
		this.options.afterMiddlewares!.push(...middlewares);
		return this;
	}

	/**
	 * Add global error handlers
	 * @param handlers
	 */
	public addErrorHandlers(...handlers: AppErrorHandler[]): OptionsBuilder {
		this.options.errorHandlers!.push(...handlers);
		return this;
	}

	/**
	 * Add authorization function to be called on @Authorized routes
	 * @param handler
	 */
	public useAuthorization(handler: AuthorizationFunction): OptionsBuilder {
		this.options.authorizationChecker = handler;
		return this;
	}

	/**
	 * Add authorization error function to be called if @Authorized routes are not authorized
	 * @param handler
	 */
	public setAuthorizationError(
		handler: GetNotAuthorizedErrorFuntion
	): OptionsBuilder {
		this.options.getNotAuthorizedError = handler;
		return this;
	}

	/**
	 * Add user returning function for all the requests
	 * @param checker
	 */
	public useAuthentication<TUser>(
		checker: CurrentUserCheckerFunction<TUser>
	): OptionsBuilder {
		this.options.currentUserChecker = checker;
		return this;
	}

	/**
	 * Set validate function
	 * @param func
	 */
	public setValidateFunction(func: ValidateFunction) {
		this.options.validateFunction = func;
		return this;
	}

	/**
	 * Set logger in container
	 * @param logger
	 */
	public setLogger(logger: ILogger) {
		this.container.set(LoggerKey, logger);
		return this;
	}

	public setTimeout(timeout: number) {
		if (timeout > 0) {
			this.options.timeout = timeout;
		}
	}

	/**
	 * Set broker connection error handler
	 * @param handler
	 */
	public setConnectionErrorHandler(handler: BrokerConnectionErrorHandler) {
		this.options.onBrokerConnnectionError = handler;
	}
}
