import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { DocumentClientOptions } from './client';
import { LoggerConfiguration } from './logger';
export interface Configurations {
    options?: DocumentClientOptions;
    logger?: LoggerConfiguration;
    credentials?: CredentialsOptions;
}
export declare class Configs {
    constructor();
    private options;
    /**
     * Update Settings
     */
    update: (configs: Configurations) => void;
    /** get credentials */
    getCredentials: () => import("aws-sdk/lib/credentials").Credentials | CredentialsOptions | null | undefined;
    getOptions: () => DocumentClientOptions;
}
