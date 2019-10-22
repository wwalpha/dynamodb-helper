import log4js from 'log4js';

export const logger = log4js.getLogger();

export const info = (message: any, ...args: any[]) => {
  if (logger.isInfoEnabled()) {
    logger.info(message, args);
  }
};

export const debug = (message: any, ...args: any[]) => {
  if (logger.isDebugEnabled()) {
    logger.debug(message, args);
  }
};

export const error = (message: any, ...args: any[]) => {
  if (logger.isErrorEnabled()) {
    logger.error(message, args);
  }
};
