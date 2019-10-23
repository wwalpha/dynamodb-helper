import { DynamoDB } from 'aws-sdk';
import { Configurations } from './config';
export declare class Helper {
    /** client instance */
    private configs?;
    constructor(configs?: Configurations);
    private getDocumentClient;
    private getClient;
    /** Get */
    getRequest: (input: DynamoDB.DocumentClient.GetItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.GetItemOutput, import("aws-sdk").AWSError>;
    /**
     *
     */
    get: (input: DynamoDB.DocumentClient.GetItemInput) => Promise<DynamoDB.DocumentClient.GetItemOutput | undefined>;
    /** Put */
    putRequest: (input: DynamoDB.DocumentClient.PutItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk").AWSError>;
    put: (input: DynamoDB.DocumentClient.PutItemInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk").AWSError>>;
    /** Query */
    queryRequest: (input: DynamoDB.DocumentClient.QueryInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.QueryOutput, import("aws-sdk").AWSError>;
    /** Query */
    query: (input: DynamoDB.DocumentClient.QueryInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.QueryOutput, import("aws-sdk").AWSError>>;
    transactWrite: (input: DynamoDB.DocumentClient.TransactWriteItemsInput) => Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput>;
    /** Scan */
    scanRequest: (input: DynamoDB.DocumentClient.ScanInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.ScanOutput, import("aws-sdk").AWSError>;
    scan: (input: DynamoDB.DocumentClient.ScanInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.ScanOutput, import("aws-sdk").AWSError>>;
    /** Update */
    updateRequest: (input: DynamoDB.DocumentClient.UpdateItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.UpdateItemOutput, import("aws-sdk").AWSError>;
    update: (input: DynamoDB.DocumentClient.UpdateItemInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, import("aws-sdk").AWSError>>;
    /** Delete */
    deleteRequest: (input: DynamoDB.DocumentClient.DeleteItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.DeleteItemOutput, import("aws-sdk").AWSError>;
    delete: (input: DynamoDB.DocumentClient.DeleteItemInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.DeleteItemOutput, import("aws-sdk").AWSError>>;
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
