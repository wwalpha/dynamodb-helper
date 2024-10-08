import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, UpdateCommandInput, UpdateCommandOutput, DeleteCommandInput, DeleteCommandOutput, ScanCommandInput, ScanCommandOutput, QueryCommandInput, QueryCommandOutput, TransactWriteCommandInput, TransactWriteCommandOutput, DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Configurations, Configs } from './configs';
export interface ScanInput extends ScanCommandInput {
}
export interface ScanOutput<T = any> extends Omit<ScanCommandOutput, 'Items' | '$metadata'> {
    /**
     * An array of item attributes that match the scan criteria. Each element in this array consists of an attribute name and the value for that attribute.
     */
    Items: T[];
}
export interface GetItemInput extends GetCommandInput {
}
export interface GetItemOutput<T = any> extends Omit<GetCommandOutput, 'Item' | '$metadata'> {
    /**
     * A map of attribute names to AttributeValue objects, as specified by ProjectionExpression.
     */
    Item?: T;
}
export interface PutItemInput<T extends Record<string, any>> extends PutCommandInput {
    /**
     * A map of attribute name/value pairs, one for each attribute. Only the primary key attributes are required; you can optionally provide other attribute name-value pairs for the item. You must provide all of the attributes for the primary key. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide both values for both the partition key and the sort key. If you specify any attributes that are part of an index key, then the data types for those attributes must match those of the schema in the table's attribute definition. Empty String and Binary attribute values are allowed. Attribute values of type String and Binary must have a length greater than zero if the attribute is used as a key attribute for a table or index. For more information about primary keys, see Primary Key in the Amazon DynamoDB Developer Guide. Each element in the Item map is an AttributeValue object.
     */
    Item: T;
}
export interface PutItemOutput<T = any> extends Omit<PutCommandOutput, 'Attributes' | '$metadata'> {
    /**
     * The attribute values as they appeared before the Put operation, but only if ReturnValues is specified as ALL_OLD in the request. Each element consists of an attribute name and an attribute value.
     */
    Attributes?: T;
}
export interface QueryInput extends QueryCommandInput {
}
export interface QueryOutput<T = any> extends Omit<QueryCommandOutput, 'Items' | '$metadata'> {
    /**
     * An array of item attributes that match the query criteria. Each element in this array consists of an attribute name and the value for that attribute.
     */
    Items: T[];
}
export interface UpdateInput extends UpdateCommandInput {
}
export interface UpdateOutput<T = any> extends Omit<UpdateCommandOutput, 'Attributes'> {
    /**
     * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
     */
    Attributes?: T;
}
export interface DeleteItemInput extends DeleteCommandInput {
}
export interface DeleteItemOutput<T = any> extends Omit<DeleteCommandOutput, 'Attributes' | '$metadata'> {
    /**
     * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
     */
    Attributes?: T;
}
export declare class DynamodbHelper {
    /** client instance */
    configs: Configs;
    docClient: DynamoDBDocument | undefined;
    client: DynamoDBClient | undefined;
    constructor(configs?: Configurations);
    /** dynamodb client */
    getDocumentClient: () => DynamoDBDocument;
    /** dynamodb client */
    getClient: () => DynamoDBClient;
    /** Get */
    private getRequest;
    /**
     *
     */
    get: <T = any>(input: GetItemInput) => Promise<GetItemOutput<T> | undefined>;
    /** Put */
    private putRequest;
    /** Put item */
    put: <T extends Record<string, any>>(input: PutItemInput<T>) => Promise<PutItemOutput<T>>;
    /** Query */
    private queryRequest;
    /** Query */
    query: <T = any>(input: QueryInput) => Promise<QueryOutput<T>>;
    transactWrite: (input: TransactWriteCommandInput) => Promise<TransactWriteCommandOutput>;
    /** Scan */
    scanRequest: <T = any>(input: ScanInput) => Promise<ScanOutput>;
    scan: <T = any>(input: ScanInput) => Promise<ScanOutput<T>>;
    /** Update */
    private updateRequest;
    update: (input: UpdateInput) => Promise<UpdateCommandOutput>;
    /** Delete */
    private deleteRequest;
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
    truncateAll: (tableName: string, lastEvaluatedKey?: Record<string, NativeAttributeValue>) => Promise<void>;
    /**
     * 一括削除（一部削除）
     */
    truncate: (tableName: string, records: Record<string, NativeAttributeValue>[]) => Promise<void>;
    /**
     * 一括登録
     */
    bulk: (tableName: string, records: Record<string, NativeAttributeValue>[]) => Promise<void>;
}
