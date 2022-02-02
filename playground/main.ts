import { Container, AppBuilder, BaseConfiguration } from '../src/';
import { Startup } from './Startup';

async function main(): Promise<void> {
	if (process.env.NODE_ENV === 'test') {
		process.on('message', async () => {
			process.exit(0);
		});
	}
	const appBuilder: AppBuilder = new AppBuilder(
		Container.get<BaseConfiguration>(BaseConfiguration)
	).useStartup(Startup);
	await appBuilder.start();
}

main().catch(console.error);
