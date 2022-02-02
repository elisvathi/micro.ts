import { OptionsBuilder, StartupBase } from '../src';
import '../src/brokers/http/hapi';
import { ValuesController } from './controllers/ValuesController';

export class Startup extends StartupBase {
	public async beforeStart(): Promise<void> {
		console.log('Before start');
	}

	public async afterStart(): Promise<void> {
		console.log('After start');
	}

	public configureServer(builder: OptionsBuilder): void {
		builder.useHapiBroker((b) => b.withConfig({ port: 3000 }));
		builder.addControllers(ValuesController);
	}
}
