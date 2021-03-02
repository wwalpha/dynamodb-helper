import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { DocumentClientOptions } from './client';
import { LoggerConfiguration } from './logger';
export interface Configurations {
  options?: DocumentClientOptions;
  logger?: LoggerConfiguration;
}
export declare class Configs {
  constructor();
  private credentials;
  private options;
  /**
   * Update Settings
   */
  update: (configs: Configurations) => void;
  /** get credentials */
  getCredentials: () => CredentialsOptions | undefined;
  getOptions: () => DocumentClientOptions | undefined;
}
