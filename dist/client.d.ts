import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
/**
 * table data item client
 */
export declare const documentClient: (options?: DynamoDBClientConfig) => DynamoDBDocument;
/**
 * table client
 *
 * @param options
 */
export declare const client: (options?: DynamoDBClientConfig) => DynamoDBClient;
