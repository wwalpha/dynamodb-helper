import log4js from 'log4js';
import { DocumentClientOptions } from './client';
import { LoggerConfiguration } from './logger';

export interface Configurations {
  options?: DocumentClientOptions;
  logger?: LoggerConfiguration;
}

export class Config {
  constructor() {}

  /**
   * Update Settings
   */
  update = (configs: Configurations) => {
    if (configs.logger) {
      log4js.configure(configs.logger);
    }
  };
}

export const config = new Config();
