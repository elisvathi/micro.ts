import {Container, Service} from "../di";
import chalk from 'chalk';

export const LoggerKey: string = '__logger';

export interface ILogger {
  info(message: any, options?: any): void;

  error(message: any, options?: any): void;

  warn(message: any, options?: any): void;

  debug(message: any, options?: any): void;
}

export class BaseLogger implements ILogger {

  debug(message: any, options?: any): void {
    console.log(chalk.gray(message), options || '');
  }

  error(message: any, options?: any): void {
    console.log(chalk.redBright(message), options || '');
  }

  info(message: any, options?: any): void {
    console.log(chalk.greenBright(message), options || '');
  }

  warn(message: any, options?: any): void {
    console.log(chalk.yellowBright(message), options || '');
  }

  // error(...args: any): void {
  //   console.log(chalk.redBright(args));
  // }
  //
  // info(...args: any): void {
  //   console.log(chalk.greenBright(args));
  // }
  //
  // warn(...args:any): void {
  //   console.log(chalk.yellowBright(args));
  // }
  //
  // debug(...args: any): void {
  //   console.log(chalk.blueBright(args));
  // }

}

export function setLogger(logger: ILogger) {
  Container.set(LoggerKey, logger);
}
