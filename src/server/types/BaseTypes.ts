import { BrokerRouteOptionsResolver } from "../../decorators";

export interface ActionResponse {
	/**
	 * Status code of the response
	 */
	statusCode?: number;
	/**
	 * Is error response
	 */
	is_error?: boolean;
	/**
	 * Error payload
	 */
	error?: any;
	/**
	 * Response headers
	 */
	headers?: any;
	/**
	 * Response body
	 */
	body?: any;
}

export interface ActionRequest {
	/**
	 * Query string
	 */
	qs?: any;
	/**
	 * Verb
	 */
	method?: any;
	/**
	 * Headers of the request
	 */
	headers?: any;
	/**
	 * Parameters in the request path
	 */
	params?: any;
	/**
	 * Body of the request
	 */
	body?: any;
	/**
	 * Raw request from the broker
	 */
	raw?: any;
	/**
	 * Full path of the request
	 */
	path: string;
}

export interface Action {
	/**
	 * Request mapped from broker request format
	 */
	request: ActionRequest;
	/**
	 * Response from the server
	 */
	response?: ActionResponse;
	/**
	 * Broker connection, up to the broker on what is placed in this value
	 */
	connection?: any;
}

export interface BaseRouteDefinition {
	/**
	 * Base path of the api: eg. 'api'
	 */
	base: string;
	/**
	 * Controller path
	 */
	controller: string;
	/**
	 * Controller constructor
	 */
	controllerCtor: Class<any>;
	/**
	 * Handler path
	 */
	handler: string;
	/**
	 * Handler function name
	 */
	handlerName: string;
	/**
	 * Verb
	 */
	method: string;
	/**
	 * Is in json format
	 */
	json?: boolean;
	/**
	 * Queue options, specific to RabbitMQ
	 */
	queueOptions?: QueueOptions;

	/**
	 * Timeout configured for the handler
	 */
	timeout?: number;

	/**
	 * Resolver for route specific broker options
	 */
	brokerRouteOptions?: BrokerRouteOptionsResolver;
}

export type AssertExchange = {
	durable?: boolean;
	internal?: boolean;
	autoDelete?: boolean;
	alternateExchange?: string;
	arguments?: any;
};
/**
 * Exchange configuration type, used as a key to <Exchange-Binding> map
 */
export type IAmqpExchangeConfig = {
	name: string;
	type: "topic" | "fanout" | "direct";
	options?: AssertExchange;
};
export interface QueueConsumeOptions {
	noLocal?: boolean;
	noAck?: boolean;
	exclusive?: boolean;
	priority?: number;
	arguments?: any;
}
export interface QueueOptions {
	exchange?: IAmqpExchangeConfig;
	bindingPattern?: string;
	consumers?: number;
	exclusive?: boolean;
	durable?: boolean;
	autoDelete?: boolean;
	arguments?: any;
	messageTtl?: number;
	expires?: number;
	deadLetterExchange?: string;
	deadLetterRoutingKey?: string;
	maxLength?: number;
	maxPriority?: number;
	consumeOptions?: QueueConsumeOptions;
}

export type Class<T = any> = { new (...args: any[]): T };
