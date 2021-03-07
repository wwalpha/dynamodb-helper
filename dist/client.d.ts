import { DynamoDB } from 'aws-sdk';
declare type XRayOptions = {
    xray?: boolean;
};
export declare type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration & XRayOptions;
export declare type ClientOptions = DynamoDB.ClientConfiguration & XRayOptions;
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
export {};
