import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Configurations } from './config';
import { PromiseResult } from 'aws-sdk/lib/request';
export declare class Helper {
    /** client instance */
    private configs?;
    constructor(configs?: Configurations);
    private getDocumentClient;
    private getClient;
    /** Get */
    getRequest: (input: DocumentClient.GetItemInput) => Request<DocumentClient.GetItemOutput, AWSError>;
    /**
     *
     */
    get: (input: DocumentClient.GetItemInput) => Promise<DocumentClient.GetItemOutput | undefined>;
    /** Put */
    putRequest: (input: DocumentClient.PutItemInput) => Request<DocumentClient.PutItemOutput, AWSError>;
    put: (input: DocumentClient.PutItemInput) => Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>>;
    /** Query */
    queryRequest: (input: DocumentClient.QueryInput) => Request<DocumentClient.QueryOutput, AWSError>;
    /** Query */
    query: (input: DocumentClient.QueryInput) => Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>>;
    transactWrite: (input: DocumentClient.TransactWriteItemsInput) => Promise<DocumentClient.TransactWriteItemsOutput>;
    /** Scan */
    scanRequest: (input: DocumentClient.ScanInput) => Request<DocumentClient.ScanOutput, AWSError>;
    scan: (input: DocumentClient.ScanInput) => Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>>;
    /** Update */
    updateRequest: (input: DocumentClient.UpdateItemInput) => Request<DocumentClient.UpdateItemOutput, AWSError>;
    update: (input: DocumentClient.UpdateItemInput) => Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>>;
    /** Delete */
    deleteRequest: (input: DocumentClient.DeleteItemInput) => Request<DocumentClient.DeleteItemOutput, AWSError>;
    delete: (input: DocumentClient.DeleteItemInput) => Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>;
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
    truncate: (tableName: string, records: DocumentClient.AttributeMap[]) => Promise<void>;
    /**
     * 一括登録
     */
    bulk: (tableName: string, records: DocumentClient.AttributeMap[]) => Promise<void>;
}
