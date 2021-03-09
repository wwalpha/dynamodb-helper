import { DynamoDB } from 'aws-sdk';
import { Configurations, Configs } from './configs';
export interface AttributeMap extends DynamoDB.DocumentClient.AttributeMap {
}
export interface ScanInput extends DynamoDB.DocumentClient.ScanInput {
}
export interface ScanOutput<T = any> extends DynamoDB.DocumentClient.ScanOutput {
    /**
     * An array of item attributes that match the scan criteria. Each element in this array consists of an attribute name and the value for that attribute.
     */
    Items?: T[];
}
export interface GetItemInput extends DynamoDB.DocumentClient.GetItemInput {
}
export interface GetItemOutput<T = any> extends DynamoDB.DocumentClient.GetItemOutput {
    /**
     * A map of attribute names to AttributeValue objects, as specified by ProjectionExpression.
     */
    Item?: T;
}
export interface PutItemInput<T = any> extends DynamoDB.DocumentClient.PutItemInput {
    /**
     * A map of attribute name/value pairs, one for each attribute. Only the primary key attributes are required; you can optionally provide other attribute name-value pairs for the item. You must provide all of the attributes for the primary key. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide both values for both the partition key and the sort key. If you specify any attributes that are part of an index key, then the data types for those attributes must match those of the schema in the table's attribute definition. Empty String and Binary attribute values are allowed. Attribute values of type String and Binary must have a length greater than zero if the attribute is used as a key attribute for a table or index. For more information about primary keys, see Primary Key in the Amazon DynamoDB Developer Guide. Each element in the Item map is an AttributeValue object.
     */
    Item: T;
}
export interface PutItemOutput<T = any> extends DynamoDB.DocumentClient.PutItemOutput {
    /**
     * The attribute values as they appeared before the PutItem operation, but only if ReturnValues is specified as ALL_OLD in the request. Each element consists of an attribute name and an attribute value.
     */
    Attributes?: T;
}
export interface QueryInput extends DynamoDB.DocumentClient.QueryInput {
}
export interface QueryOutput<T = any> extends DynamoDB.DocumentClient.QueryOutput {
    /**
     * An array of item attributes that match the query criteria. Each element in this array consists of an attribute name and the value for that attribute.
     */
    Items?: T[];
}
export interface UpdateItemInput extends DynamoDB.DocumentClient.UpdateItemInput {
}
export interface UpdateItemOutput<T = any> extends DynamoDB.DocumentClient.UpdateItemOutput {
    /**
     * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
     */
    Attributes?: T;
}
export interface DeleteItemInput extends DynamoDB.DocumentClient.DeleteItemInput {
}
export interface DeleteItemOutput<T = any> extends DynamoDB.DocumentClient.DeleteItemOutput {
    /**
     * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
     */
    Attributes?: T;
}
export declare class DynamodbHelper {
    /** client instance */
    configs: Configs;
    constructor(configs?: Configurations);
    /** dynamodb document client */
    getDocumentClient: () => DynamoDB.DocumentClient;
    /** dynamodb client */
    getClient: () => DynamoDB;
    /** Get */
    getRequest: (input: GetItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.GetItemOutput, import("aws-sdk").AWSError>;
    /**
     *
     */
    get: <T = any>(input: GetItemInput) => Promise<GetItemOutput<T> | undefined>;
    /** Put */
    putRequest: <T = any>(input: PutItemInput<T>) => import("aws-sdk").Request<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk").AWSError>;
    /** Put item */
    put: <T = any>(input: PutItemInput<T>) => Promise<PutItemOutput<T>>;
    /** Query */
    queryRequest: (input: QueryInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.QueryOutput, import("aws-sdk").AWSError>;
    /** Query */
    query: <T = any>(input: QueryInput) => Promise<QueryOutput<T>>;
    transactWrite: (input: DynamoDB.DocumentClient.TransactWriteItemsInput) => Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput>;
    /** Scan */
    scanRequest: (input: ScanInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.ScanOutput, import("aws-sdk").AWSError>;
    scan: <T = any>(input: ScanInput) => Promise<ScanOutput<T>>;
    /** Update */
    updateRequest: (input: UpdateItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.UpdateItemOutput, import("aws-sdk").AWSError>;
    update: (input: UpdateItemInput) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.UpdateItemOutput, import("aws-sdk").AWSError>>;
    /** Delete */
    deleteRequest: (input: DeleteItemInput) => import("aws-sdk").Request<DynamoDB.DocumentClient.DeleteItemOutput, import("aws-sdk").AWSError>;
    delete: <T = any>(input: DeleteItemInput) => Promise<DeleteItemOutput<T>>;
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
