import {
	Channel,
	connect,
	Connection,
	ConsumeMessage,
	Message,
	Options,
} from 'amqplib';
import { Container } from '../../di';
import { unzipAsync, zipAsync } from '../../helpers/BaseHelpers';
import { ILogger, LoggerKey } from '../../server/Logger';
import {
	Action,
	BaseRouteDefinition,
	IAmqpExchangeConfig,
	QueueOptions,
	QueueConsumeOptions,
} from '../../server/types';
import {
	AbstractBroker,
	ActionHandler,
	DefinitionHandlerPair,
} from '../AbstractBroker';
import { RequestMapper, RouteMapper } from '../IBroker';
import { AmqpClient, AmqpClientOptions } from './AmqpClient';
/**
 * Configuration for amqp connection
 */
export type IAmqpConfig = string | Options.Connect;
/**
 * Binding pair with the queue name and the binding pattern
 */
export type IAmqpBindingConfig = { queue: string; pattern: string };

/**
 * Interface to pass into the AmqpClient to get a connection, and an existing channel if needed
 */
export interface IAmqpConnectionHooks {
	/**
	 * Return an existing connection
	 */
	getConnection(): Connection;

	/**
	 * Return an existing chanel
	 */
	getChannel(): Channel;
}

export interface TopicBasedAmqpConfig {
	/**
	 * Connections string or connection options
	 */
	connection: IAmqpConfig;
	/**
	 * Default topic exchange name
	 */
	topic: string;
}

export class AmqpBroker<T = IAmqpConfig>
	extends AbstractBroker<T>
	implements IAmqpConnectionHooks
{
	public name: string = 'AmqpBroker';
	protected connection!: Connection;
	protected channel!: Channel;
	private beforeAssertHooks: Array<() => Promise<void>> = [];
	/**
	 * Default exchange for all the queues
	 */
	private _defaultExchange: IAmqpExchangeConfig = {
		type: 'direct',
		name: '',
	};

	public addBeforeAssertHook(hook: () => Promise<void>): void {
		this.beforeAssertHooks.push(hook);
	}

	private async execBeforeAsssertHooks(): Promise<void> {
		for (const hook of this.beforeAssertHooks) {
			await hook();
		}
	}

	/**
	 * Getter for the default exchange
	 */
	public get defaultExchange(): IAmqpExchangeConfig {
		return this._defaultExchange;
	}

	/**
	 * Setter for the default exchange
	 * @param value
	 */
	public set defaultExchange(value: IAmqpExchangeConfig) {
		this._defaultExchange = value;
	}

	/**
	 * Bindings map created when adding queues
	 */
	private bindings: Map<IAmqpExchangeConfig, IAmqpBindingConfig[]> = new Map<
		IAmqpExchangeConfig,
		IAmqpBindingConfig[]
	>();

	private async getPayload<T>(r: Message, json: boolean): Promise<T> {
		const headers = r.properties.headers || {};
		const isJson = !!headers['json'] && json;
		const isGzip = headers['Content-Encoding'] === 'gzip';
		const messageBytes = r.content;
		let messageString = r.content.toString();
		if (isGzip) {
			const unzippedBytes = await unzipAsync(messageBytes);
			messageString = unzippedBytes.toString();
		}
		if (isJson) {
			return JSON.parse(messageString);
		}
		let msg: any = messageString;
		try {
			msg = JSON.parse(messageString);
		} catch (jsonParseError) {
			// ignore
		}
		return msg;
	}

	private async convertPayload(
		payload: any,
		requestHeaders: any
	): Promise<Buffer> {
		const isJson =
			requestHeaders['json'] || (!!payload && payload instanceof Object);
		if (isJson && !requestHeaders['json']) {
			requestHeaders['json'] = true;
		}
		const isGzip = requestHeaders['Content-Encoding'] === 'gzip';
		let payloadString = '';
		if (isJson) {
			payloadString = JSON.stringify(payload);
		} else {
			if (!!payload && payload instanceof Object) {
				payloadString = JSON.stringify(payload);
			} else {
				if (payload !== null && payload !== undefined) {
					payloadString = payload.toString();
				} else {
					payloadString = '';
				}
			}
		}
		if (isGzip) {
			const gzipBytes = await zipAsync(payloadString);
			return gzipBytes;
		}
		return Buffer.from(payloadString);
	}

	/**
	 * Map an amqp message on a given queue to Action object
	 * @param r
	 * @param queue
	 * @param routingKey
	 * @param json
	 */
	protected requestMapper: RequestMapper = async (
		r: Message,
		queue: string,
		routingKey: string,
		json: boolean,
		options?: QueueConsumeOptions
	) => {
		let payload;
		try {
			payload = await this.getPayload(r, json);
		} catch (err) {
			const shouldNotAck = !!options && !!options.noAck;
			if (!shouldNotAck) {
				this.channel.ack(r);
			}
			throw err;
		}
		const routingKeySplit = routingKey.split('.');
		const queueSplit = this.extractQueueParamNames(queue);
		const params: any = {};
		if (routingKeySplit.length === queueSplit.length) {
			queueSplit.forEach((item, index) => {
				if (item.param) {
					params[item.name] = routingKeySplit[index];
				}
			});
		}
		const act: Action = {
			request: {
				params,
				path: queue,
				headers: r.properties.headers,
				// method: def.method,
				body: payload,
				qs: {},
				raw: r,
			},
			connection: this.connection,
		};
		return act;
	};

	/**
	 * Default route mapping
	 */
	protected routeMapper: RouteMapper = (def: BaseRouteDefinition) => {
		let result = `${def.base}/${def.controller}/${def.handler}`;
		result = result.replace(/\/{2,}/g, '/').replace(/\//g, '.');
		if (result.endsWith('.')) {
			result = result.slice(0, result.length - 1);
		}
		return result;
	};

	/**
	 * Creates an AMQP client which provides sendToQueue, publish, and rpc methods, to work with the AMQP server
	 * @param opts
	 */
	public async createClient(
		opts?: Partial<AmqpClientOptions>
	): Promise<AmqpClient> {
		const defaultOptions: AmqpClientOptions = {
			rpcQueue: 'rpc',
			unique: true,
			newChannel: true,
		};
		/**
		 * Append configured options to the default options
		 */
		const options = { ...defaultOptions, ...(opts || {}) };

		/**
		 * Create client an channels
		 */
		const client = new AmqpClient(this, options);
		await client.init();
		return client;
	}

	/**
	 * Return AMQP connection, available after the server is started
	 */
	public getConnection(): Connection {
		return this.connection;
	}

	/**
	 * Returns the broker channel used to consume the app queues
	 */
	public getChannel(): Channel {
		return this.channel;
	}

	/**
	 * Consume message from the asserted queue, find its corresponding handler, execute the handler,
	 * and if can reply, respond to the replyTo queue
	 * @param route
	 * @param message
	 * @param value
	 * @param json
	 */
	protected async consumeMessage(
		route: string,
		message: ConsumeMessage | null,
		value: DefinitionHandlerPair[],
		json: boolean,
		options?: QueueConsumeOptions
	): Promise<void> {
		if (message) {
			const exchange = message.fields.exchange || '';
			const routingKey = message.fields.routingKey;
			/**
			 * Convert message to action
			 */
			const mapped: Action = await this.requestMapper(
				message,
				route,
				routingKey,
				json,
				options
			);
			/**
			 * Find the corresponding handler for the action object
			 */
			const handler = this.actionToRouteMapper(route, mapped, value);
			/**
			 * Execute handler
			 */
			const result = await handler(mapped);
			/**
			 * If possible publish the value to the replyTo queue
			 */
			if (
				result &&
				message.properties.replyTo &&
				message.properties.correlationId
			) {
				await this.rpcReply(
					result,
					message.properties.replyTo,
					message.properties.correlationId,
					message.properties.headers
				);
			}
			const shouldNotAck = !!options && !!options.noAck;
			if (!shouldNotAck) {
				this.channel.ack(message);
			}
		}
	}

	/**
	 * Registered a single route definition and consumes messages from it
	 * Called when the server is started
	 * @param value
	 * @param route
	 */
	protected async registerSingleRoute(
		value: DefinitionHandlerPair[],
		route: string
	): Promise<boolean> {
		let json = false;
		let totalConsumers = 0;
		let queueOptions: QueueOptions = {};
		const consumeOptions = {};
		/*
		 * Finds the number of consumers and the assertQueue options
		 */
		value.forEach((v) => {
			if (Object.keys(queueOptions).length === 0 && v.def.queueOptions) {
				/**
				 * Get the last queue options, in case there is collisions
				 */
				queueOptions = { ...v.def.queueOptions };
				Object.assign(
					consumeOptions,
					v.def.queueOptions.consumeOptions || {}
				);
				/**
				 * Remove the consumers key from the queue options, to use the resulting object as Options on queue assertion
				 */
				delete queueOptions.consumers;
				delete queueOptions.consumeOptions;
			}
			const consumers = v.def.queueOptions
				? v.def.queueOptions.consumers || 1
				: 1;
			if (v.def.json) {
				json = true;
			}
			totalConsumers += consumers;
		});
		if (totalConsumers > 0) {
			await this.channel.assertQueue(route, queueOptions);
			const exchanges: Array<{ exchange: string; pattern: string }> = [];
			/**
			 * Find all associated bindings
			 */
			this.bindings.forEach((values, key) => {
				const item = values.find((x) => x.queue === route);
				if (item) {
					exchanges.push({
						exchange: key.name,
						pattern: item.pattern,
					});
				}
			});
			/**
			 * Bind the queue to all associated exchanges
			 */
			if (exchanges.length) {
				/**
				 * Bind queue to the configured exchanges
				 */
				for (let i = 0; i < exchanges.length; i++) {
					await this.channel.bindQueue(
						route,
						exchanges[i].exchange,
						exchanges[i].pattern
					);
				}
			}
			/**
			 * Create the specified number of consumers
			 */
			for (let i = 0; i < totalConsumers; i++) {
				await this.channel.consume(
					route,
					async (message: ConsumeMessage | null) => {
						await this.consumeMessage(
							route,
							message,
							value,
							json,
							consumeOptions
						);
					},
					consumeOptions
				);
			}
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Add single route, get its exchanges config and save it in the binding map
	 * @param def
	 * @param handler
	 */
	public addRoute(def: BaseRouteDefinition, handler: ActionHandler): string {
		/**
		 * Check if a default exchange configuration exists
		 */
		const hasDefaultExchange: boolean =
			!!this.defaultExchange && this.defaultExchange.name.length > 0;
		/**
		 * Check if a custom exchange configuration exists
		 */
		const hasCustomExchange: boolean =
			!!def.queueOptions &&
			!!def.queueOptions.exchange &&
			def.queueOptions.exchange.name.length > 0;
		/**
		 * Build a list of exchange configurations
		 */
		const exchanges: Array<IAmqpExchangeConfig> = [];
		if (hasDefaultExchange) {
			exchanges.push(this.defaultExchange);
		}
		if (hasCustomExchange) {
			exchanges.push(def.queueOptions!.exchange!);
		}
		/**
		 * Call super method and get the resulting queue
		 */
		const queue = super.addRoute(def, handler);

		/**
		 * For each exchange configuration insert on the exchanges map, the current bindings
		 */
		exchanges.forEach((exchange) => {
			let pattern = '';
			if (!!def.queueOptions && !!def.queueOptions.bindingPattern) {
				/**
				 * If binding pattern configured on the handler use that value as a binding pattern
				 */
				pattern = def.queueOptions.bindingPattern;
			} else {
				/**
				 * Process the binding pattern using the queue name and the type of the exchange
				 * if the exchange is a 'topic' extract the param names from the queue names and replace them with '#'
				 * on the binding pattern
				 */
				pattern = this.getQueuePattern(queue, exchange.type);
			}
			/**
			 * Find saved exchanges by name only, if an exchange configured more than 1 time with difference options,
			 * keep the exchange with the first occurring options
			 */
			const keys = Array.from(this.bindings.keys());
			/**
			 * Check if the exchange already exists on the map
			 */
			const found = keys.find((x) => x.name === exchange!.name);
			let bindings: { queue: string; pattern: string }[] = [];
			/**
			 * If the exchange name found in the current configuration, get the key and the value and delete it form the map,
			 * Update the key with the new options, and reset it in the map with the new options and bindings
			 */
			if (found) {
				bindings = this.bindings.get(found) || [];
				this.bindings.delete(found);
				found.options = found.options || exchange!.options;
				exchange = found;
			}
			bindings.push({ queue, pattern: pattern || '' });
			this.bindings.set(exchange, bindings);
		});
		return queue;
	}

	/**
	 * Assert every exchange
	 */
	private async assertExchanges(): Promise<void> {
		const exchanges = Array.from(this.bindings.keys());
		for (let i = 0; i < exchanges.length; i++) {
			await this.channel.assertExchange(
				exchanges[i].name,
				exchanges[i].type,
				exchanges[i].options
			);
		}
	}

	protected async registerRoutes(): Promise<void> {
		await this.assertExchanges();
		const routes: Array<{ value: DefinitionHandlerPair[]; route: string }> =
			[];
		/**
		 * Convert key value to array
		 */
		this.registeredRoutes.forEach(
			(value: DefinitionHandlerPair[], route: string) => {
				routes.push({ value, route });
			}
		);
		/**
		 * Await each item on registering the routes
		 */
		for (let i = 0; i < routes.length; i++) {
			await this.registerSingleRoute(routes[i].value, routes[i].route);
		}
	}

	/**
	 * Reply if the message has replyTo queue  and correlationId
	 * @param data
	 * @param replyToQueue
	 * @param correlationId
	 */
	protected async rpcReply(
		data: Action,
		replyToQueue: string,
		correlationId: string,
		requestHeaders: any = {}
	): Promise<void> {
		const response = data.response || {};
		const body = response.body || response.error;
		const headers = response.headers || {};
		if (response.is_error) {
			headers.error = true;
		}
		headers.statusCode = response.statusCode;
		headers.json = !!requestHeaders.json;
		if (requestHeaders['Content-Encoding']) {
			headers['Content-Encoding'] = requestHeaders['Content-Encoding'];
		}
		const reply = await this.convertPayload(body, requestHeaders);
		/**
		 * Reply if the message has rpcReply and correlationId
		 */
		this.channel.sendToQueue(replyToQueue, reply, {
			correlationId,
			headers,
		});
	}

	protected get connectionConfig(): IAmqpConfig {
		return this.config;
	}

	/**
	 * Create connection and channel,
	 * assert exchanges and queues,
	 * create bindings,
	 * register consumers
	 */
	public async start(): Promise<void> {
		this.connection = await connect(this.connectionConfig);
		this.connection.on('close', (e) => {
			this.handleConnectionError(e);
		});
		this.connection.on('error', (e) => {
			this.handleConnectionError(e);
		});
		this.channel = await this.connection.createChannel();
		await this.execBeforeAsssertHooks();
		await this.registerRoutes();
		Container.get<ILogger>(LoggerKey).info(
			`AMQP Connected on ${this.connectionConfig}`
		);
	}

	/**
	 * Extract params for a given queue string
	 * @param queue
	 */
	protected extractQueueParamNames(
		queue: string
	): { name: string; param: boolean }[] {
		return this.extractParamNames(queue, '.');
	}

	/**
	 * Get a queue pattern string from a given queue name,
	 * If exchange type is not topic return the queue name as a pattern,
	 * else replace all ':param' parts of the string with '#'
	 * @param queue
	 * @param type
	 */
	protected getQueuePattern(
		queue: string,
		type: 'topic' | 'direct' | 'fanout'
	): string {
		if (type === 'topic') {
			return queue
				.split('.')
				.map((x) => {
					if (x.length > 0 && x[0] === ':') {
						return '#';
					}
					return x;
				})
				.join('.');
		}
		return queue;
	}

	/**
	 * Called immediately after broker configuration is set, either with a constructor configuration,
	 * or a config resolver from an IConfiguration instance
	 */
	protected construct(): void {
		// Do nothing
	}
}
