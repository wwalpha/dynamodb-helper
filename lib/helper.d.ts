import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
export interface Configurations {
    xray?: boolean;
    options?: DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;
}
export default class DynamodbHelper {
    configs: Configurations;
    constructor(configs?: Configurations);
    /**
     *
     */
    get: (input: DynamoDB.DocumentClient.GetItemInput) => Promise<DynamoDB.DocumentClient.GetItemOutput | undefined>;
}
