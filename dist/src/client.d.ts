import { DynamoDB } from 'aws-sdk';
export declare type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;
export declare type ClientOptions = DynamoDB.ClientConfiguration;
/**
 * table data item client
 */
export declare const documentClient: (options?: DocumentClientOptions) => DynamoDB.DocumentClient;
/**
 * table client
 *
 * @param options
 */
export declare const client: (options?: ClientOptions) => DynamoDB;
