import { DynamoDB } from 'aws-sdk';
declare type XRayOption = {
    xray?: boolean;
};
export declare type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration & XRayOption;
export declare type ClientOptions = DynamoDB.ClientConfiguration & XRayOption;
/**
 *
 */
export declare const documentClient: (options?: DocumentClientOptions) => DynamoDB.DocumentClient;
export declare const client: (options?: ClientOptions) => DynamoDB;
export {};
