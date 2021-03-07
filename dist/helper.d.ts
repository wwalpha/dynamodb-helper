import { AWSError, Request, DynamoDB } from 'aws-sdk';
import { Configurations, Configs } from './configs';
import { PromiseResult } from 'aws-sdk/lib/request';
export declare class DynamodbHelper {
    /** client instance */
    configs: Configs;
    constructor(configs?: Configurations);
    /** dynamodb document client */
    getDocumentClient: () => DynamoDB.DocumentClient;
    /** dynamodb client */
    getClient: () => DynamoDB;
    /** Get */
    getRequest: (input: DynamoDB.DocumentClient.GetItemInput) => Request<DynamoDB.DocumentClient.GetItemOutput, AWSError>;
    /**
     *
     */
    get: (input: DynamoDB.DocumentClient.GetItemInput) => Promise<DynamoDB.DocumentClient.GetItemOutput | undefined>;
    /** Put */
    putRequest: (input: DynamoDB.DocumentClient.PutItemInput) => Request<DynamoDB.DocumentClient.PutItemOutput, AWSError>;
    put: (input: DynamoDB.DocumentClient.PutItemInput) => Promise<PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>>;
    /** Query */
    queryRequest: (input: DynamoDB.DocumentClient.QueryInput) => Request<DynamoDB.DocumentClient.QueryOutput, AWSError>;
    /** Query */
    query: (input: DynamoDB.DocumentClient.QueryInput) => Promise<PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWSError>>;
    transactWrite: (input: DynamoDB.DocumentClient.TransactWriteItemsInput) => Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput>;
    /** Scan */
    scanRequest: (input: DynamoDB.DocumentClient.ScanInput) => Request<DynamoDB.DocumentClient.ScanOutput, AWSError>;
    scan: (input: DynamoDB.DocumentClient.ScanInput) => Promise<PromiseResult<DynamoDB.DocumentClient.ScanOutput, AWSError>>;
    /** Update */
    updateRequest: (input: DynamoDB.DocumentClient.UpdateItemInput) => Request<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>;
    update: (input: DynamoDB.DocumentClient.UpdateItemInput) => Promise<PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, AWSError>>;
    /** Delete */
    deleteRequest: (input: DynamoDB.DocumentClient.DeleteItemInput) => Request<DynamoDB.DocumentClient.DeleteItemOutput, AWSError>;
    delete: (input: DynamoDB.DocumentClient.DeleteItemInput) => Promise<PromiseResult<DynamoDB.DocumentClient.DeleteItemOutput, AWSError>>;
    /** テーブル情報を取得する */
    private tableSchema;
    /** バッチ削除リクエストを作成 */
    private batchDeleteRequest;
    /** バッチ登録リクエストを作成 */
    private batchPutRequest;
    /** バッチリクエストを実行する */
    private process;
    /**
     * 一括削除（全件削除）
     */
    truncateAll: (tableName: string) => Promise<void>;
    /**
     * 一括削除（一部削除）
     */
    truncate: (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => Promise<void>;
    /**
     * 一括登録
     */
    bulk: (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => Promise<void>;
}
