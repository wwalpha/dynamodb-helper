import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import Logger, { LoggerConfiguration } from './logger';

export interface Configurations {
  options?: DynamoDBClientConfig;
  logger?: LoggerConfiguration;
}

export class Configs {
  constructor() {}

  private options: DynamoDBClientConfig = {
    region: process.env.AWS_DEFAULT_REGION,
  };

  /**
   * Update Settings
   */
  update = (configs: Configurations) => {
    if (configs.logger) {
      Logger.updateOptions(configs.logger);
    }

    if (configs.options) {
      this.options = { ...this.options, ...configs.options };
    }
  };

  /** get credentials */
  getCredentials = () => this.options.credentials;

  getOptions = () => this.options;
}
