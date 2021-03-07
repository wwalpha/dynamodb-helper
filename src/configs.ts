import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import log4js from 'log4js';
import { DocumentClientOptions } from './client';
import { LoggerConfiguration } from './logger';

export interface Configurations {
  options?: DocumentClientOptions;
  logger?: LoggerConfiguration;
  credentials?: CredentialsOptions;
}

export class Configs {
  constructor() {}

  private options: DocumentClientOptions = {
    region: process.env.AWS_DEFAULT_REGION,
  };

  /**
   * Update Settings
   */
  update = (configs: Configurations) => {
    if (configs.logger) {
      log4js.configure(configs.logger);
    }

    if (configs.credentials) {
      this.options.credentials = configs.credentials;
    }

    if (configs.options) {
      this.options = { ...this.options, ...configs.options };
    }
  };

  /** get credentials */
  getCredentials = () => this.options.credentials;

  getOptions = () => this.options;
}
