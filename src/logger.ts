import winston, { LoggerOptions } from 'winston';

export type LoggerConfiguration = winston.LoggerOptions;

export default class Logger {
  private static logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });

  constructor() {}

  static info = (message: any, ...args: any[]) => {
    if (this.logger.isInfoEnabled()) {
      if (args.length > 0) {
        this.logger.info(message, args);
      } else {
        this.logger.info(message);
      }
    }
  };

  static debug = (message: any, ...args: any[]) => {
    if (this.logger.isDebugEnabled()) {
      if (args.length > 0) {
        this.logger.debug(message, args);
      } else {
        this.logger.debug(message);
      }
    }
  };

  static error = (message: any, ...args: any[]) => {
    if (this.logger.isErrorEnabled()) {
      if (args.length > 0) {
        this.logger.error(message, args);
      } else {
        this.logger.error(message);
      }
    }
  };

  static updateOptions = (options: LoggerOptions) => {
    this.logger = winston.createLogger(options);
  };
}
