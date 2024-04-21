import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { LoggerConfiguration } from './logger';
export interface Configurations {
    options?: DynamoDBClientConfig;
    logger?: LoggerConfiguration;
}
export declare class Configs {
    constructor();
    private options;
    /**
     * Update Settings
     */
    update: (configs: Configurations) => void;
    /** get credentials */
    getCredentials: () => import("@smithy/types").AwsCredentialIdentity | import("@smithy/types").AwsCredentialIdentityProvider | undefined;
    getOptions: () => DynamoDBClientConfig;
}
