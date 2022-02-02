import { Container } from '../di';
// import chalk from 'chalk';

export const LoggerKey: string = '__logger';

export interface ILogger {
	info(message: any, options?: any): void;

	error(message: any, options?: any): void;

	warn(message: any, options?: any): void;

	debug(message: any, options?: any): void;
}

export class BaseLogger implements ILogger {
	debug(message: any, options?: any): void {
		// console.log(chalk.gray(message), options || '');
		console.log(message, options || '');
	}

	error(message: any, options?: any): void {
		// console.log(chalk.redBright(message), options || '');
		console.log(message, options || '');
	}

	info(message: any, options?: any): void {
		// console.log(chalk.greenBright(message), options || '');
		console.log(message, options || '');
	}

	warn(message: any, options?: any): void {
		// console.log(chalk.yellowBright(message), options || '');
		console.log(message, options || '');
	}
}

export function setLogger(logger: ILogger): void {
	Container.set(LoggerKey, logger);
}
