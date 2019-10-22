import log4js, { Configuration } from 'log4js';

const logger = log4js.getLogger();

export type LoggerConfiguration = Configuration;

export default class Logger {
  constructor() {}

  static info = (message: any, ...args: any[]) => {
    if (logger.isInfoEnabled()) {
      if (args.length > 0) {
        logger.info(message, args);
      } else {
        logger.info(message);
      }
    }
  };

  static debug = (message: any, ...args: any[]) => {
    if (logger.isDebugEnabled()) {
      if (args.length > 0) {
        logger.debug(message, args);
      } else {
        logger.debug(message);
      }
    }
  };

  static error = (message: any, ...args: any[]) => {
    if (logger.isErrorEnabled()) {
      if (args.length > 0) {
        logger.error(message, args);
      } else {
        logger.error(message);
      }
    }
  };
}
