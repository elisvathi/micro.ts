import { Container } from "../di";
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
    console.error(chalk.redBright(message), options || '');
  }

  info(message: any, options?: any): void {
    console.log(chalk.greenBright(message), options || '');
  }

  warn(message: any, options?: any): void {
    console.log(chalk.yellowBright(message), options || '');
  }
}

export function setLogger(logger: ILogger) {
  Container.set(LoggerKey, logger);
}
export class Log {
  public static get logger(): ILogger {
    return Container.get<ILogger>(LoggerKey);
  }

  public static info(message: any, extra?: any) {
    this.logger.info(message, extra);
  }

  public static error(message: any, extra?: any) {
    this.logger.error(message, extra);
  }

  public static debug(message: any, extra?: any) {
    this.logger.debug(message, extra);
  }

  public static warn(message: any, extra?: any) {
    this.logger.warn(message, extra);
  }
}
