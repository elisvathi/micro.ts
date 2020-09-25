import config from 'config'
import { Action, BaseRouteDefinition, Forbidden, IMiddleware } from '../src'
// import "../src/brokers/amqp";
import { AmqpBroker } from '../src/brokers/amqp'
import '../src/brokers/http/express'
import '../src/brokers/http/fastify'
import '../src/brokers/http/hapi'
import '../src/brokers/http/koa'
import { IBroker } from '../src/brokers/IBroker'
import '../src/brokers/redis'
import '../src/brokers/socketio'
import '../src/plugins/typeorm'
import { AppBuilder, IConfiguration, OptionsBuilder, StartupBase } from '../src/server'
import { DataController } from './controllers/DataController'
import { UsersController } from './controllers/UsersController'

class InterruptMiddleware implements IMiddleware {
	do(
		action: Action,
		def?: BaseRouteDefinition,
		controller?: any,
		broker?: IBroker<any>,
		send?: (data: any) => Action
	): Action | Promise<Action> {
		// if(send){
		//   return send({ok: true});
		// }
		return action
	}
}

class Startup extends StartupBase {
	public async beforeStart(): Promise<void> {}

	public async afterStart(): Promise<void> {}

	public configureServer(builder: OptionsBuilder): void {
		builder.setDevMode(true)
		builder.setLogRequests(true)
		builder.setLogErrors(true)
		builder.addBeforeMiddlewares(InterruptMiddleware)
		builder.addControllers(DataController, UsersController)
		builder.useHapiBroker(b => b.withConfigResolver(c => c.getFromPath('http.hapi')))
		// const br = builder.useAmqpBroker(b=>b.withConfigResolver(c=>c.getFromPath("amqp.url")));

		builder.useAuthorization((a: Action, options: any) => {
			return false
		})
		builder.setAuthorizationError((a: Action, options: any) => {
			return new Forbidden('You are not authorized to use this feature')
		})
		builder.setConnectionErrorHandler((b: IBroker, err: any) => {
			console.log('Got connection error on broker ' + b.name)
			console.log('ERROR', err)
			if (b.constructor === AmqpBroker) {
				process.exit(1)
			}
		})
	}
}

class DefaultConfig implements IConfiguration {
	getFromPath<T>(path: string): T {
		return config.get(path)
	}
}

async function main() {
	const builder = new AppBuilder(new DefaultConfig()).useStartup(Startup)
	await builder.start()
}

main().catch(console.log)
