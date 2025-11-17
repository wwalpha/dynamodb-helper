import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, UpdateCommandInput, UpdateCommandOutput, DeleteCommandInput, DeleteCommandOutput, ScanCommandInput, ScanCommandOutput, QueryCommandInput, QueryCommandOutput, TransactWriteCommandInput, TransactWriteCommandOutput, DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Configurations, Configs } from './configs';
type DynamoRecord = Record<string, NativeAttributeValue>;
type CommandOutputWithoutMetadata<O> = Omit<O, '$metadata'>;
type ResultWithItems<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Items'> & {
    Items: T[];
};
type ResultWithOptionalItem<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Item'> & {
    Item?: T;
};
type ResultWithOptionalAttributes<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Attributes'> & {
    Attributes?: T;
};
export interface ScanInput extends ScanCommandInput {
}
export type ScanOutput<T = DynamoRecord> = ResultWithItems<ScanCommandOutput, T>;
export interface GetItemInput extends GetCommandInput {
}
export type GetItemOutput<T = DynamoRecord> = ResultWithOptionalItem<GetCommandOutput, T>;
export interface PutItemInput<T extends DynamoRecord> extends PutCommandInput {
    /**
     * A map of attribute name/value pairs, one for each attribute. Only the primary key attributes are required; you can optionally provide other attribute name-value pairs for the item. You must provide all of the attributes for the primary key. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide both values for both the partition key and the sort key. If you specify any attributes that are part of an index key, then the data types for those attributes must match those of the schema in the table's attribute definition. Empty String and Binary attribute values are allowed. Attribute values of type String and Binary must have a length greater than zero if the attribute is used as a key attribute for a table or index. For more information about primary keys, see Primary Key in the Amazon DynamoDB Developer Guide. Each element in the Item map is an AttributeValue object.
     */
    Item: T;
}
export type PutItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<PutCommandOutput, T>;
export interface QueryInput extends QueryCommandInput {
}
export type QueryOutput<T = DynamoRecord> = ResultWithItems<QueryCommandOutput, T>;
export interface UpdateInput extends UpdateCommandInput {
}
export type UpdateOutput<T = DynamoRecord> = ResultWithOptionalAttributes<UpdateCommandOutput, T>;
export interface DeleteItemInput extends DeleteCommandInput {
}
export type DeleteItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<DeleteCommandOutput, T>;
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
    get: <T extends DynamoRecord = DynamoRecord>(input: GetItemInput) => Promise<GetItemOutput<T> | undefined>;
    /** Put */
    private putRequest;
    /** Put item */
    put: <T extends DynamoRecord>(input: PutItemInput<T>) => Promise<PutItemOutput<T>>;
    /** Query */
    private queryRequest;
    /** Query */
    query: <T extends DynamoRecord = DynamoRecord>(input: QueryInput) => Promise<QueryOutput<T>>;
    transactWrite: (input: TransactWriteCommandInput) => Promise<TransactWriteCommandOutput>;
    /** Scan */
    scanRequest: <T extends DynamoRecord = DynamoRecord>(input: ScanInput) => Promise<ScanOutput<T>>;
    scan: <T extends DynamoRecord = DynamoRecord>(input: ScanInput) => Promise<ScanOutput<T>>;
    /** Update */
    private updateRequest;
    update: (input: UpdateInput) => Promise<UpdateCommandOutput>;
    /** Delete */
    private deleteRequest;
    delete: <T extends DynamoRecord = DynamoRecord>(input: DeleteItemInput) => Promise<DeleteItemOutput<T>>;
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
    truncateAll: (tableName: string, lastEvaluatedKey?: DynamoRecord) => Promise<void>;
    /**
     * 一括削除（一部削除）
     */
    truncate: (tableName: string, records: DynamoRecord[]) => Promise<void>;
    /**
     * 一括登録
     */
    bulk: (tableName: string, records: DynamoRecord[]) => Promise<void>;
}
export {};
