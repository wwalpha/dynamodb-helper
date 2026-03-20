import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { BatchGetCommandInput, DeleteCommandInput, DeleteCommandOutput, DynamoDBDocument, GetCommandInput, GetCommandOutput, PutCommandInput, PutCommandOutput, QueryCommandInput, QueryCommandOutput, ScanCommandInput, ScanCommandOutput, TransactWriteCommandInput, TransactWriteCommandOutput, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Configurations, Configs } from './configs';
export type DynamoRecord = Record<string, NativeAttributeValue>;
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
export interface ScanPageInput extends ScanCommandInput {
}
export type ScanPageOutput<T = DynamoRecord> = ResultWithItems<ScanCommandOutput, T>;
export interface GetItemInput extends GetCommandInput {
}
export type GetItemOutput<T = DynamoRecord> = ResultWithOptionalItem<GetCommandOutput, T>;
export interface PutItemInput<T extends DynamoRecord> extends PutCommandInput {
    Item: T;
}
export type PutItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<PutCommandOutput, T>;
export interface QueryInput extends QueryCommandInput {
}
export type QueryOutput<T = DynamoRecord> = ResultWithItems<QueryCommandOutput, T>;
export interface QueryPageInput extends QueryCommandInput {
}
export type QueryPageOutput<T = DynamoRecord> = ResultWithItems<QueryCommandOutput, T>;
export interface UpdateInput extends UpdateCommandInput {
}
export type UpdateOutput<T = DynamoRecord> = ResultWithOptionalAttributes<UpdateCommandOutput, T>;
export interface DeleteItemInput extends DeleteCommandInput {
}
export type DeleteItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<DeleteCommandOutput, T>;
export interface BatchGetOptions extends Omit<BatchGetCommandInput, 'RequestItems'> {
    maxRetries?: number;
}
export interface TruncateConcurrentOptions {
    concurrency?: number;
    maxRetries?: number;
}
export declare class DynamodbHelper {
    configs: Configs;
    docClient: DynamoDBDocument | undefined;
    client: DynamoDBClient | undefined;
    constructor(configs?: Configurations);
    getDocumentClient: () => DynamoDBDocument;
    getClient: () => DynamoDBClient;
    private stripMetadata;
    private splitIntoChunks;
    private collectAllPages;
    private processWriteBatch;
    private processWriteRequests;
    private getRequest;
    get: <T extends DynamoRecord = DynamoRecord>(input: GetItemInput) => Promise<GetItemOutput<T> | undefined>;
    private putRequest;
    put: <T extends DynamoRecord>(input: PutItemInput<T>) => Promise<PutItemOutput<T>>;
    private queryRequest;
    queryPage: <T extends DynamoRecord = DynamoRecord>(input: QueryPageInput) => Promise<QueryPageOutput<T>>;
    queryAll: <T extends DynamoRecord = DynamoRecord>(input: QueryInput) => Promise<QueryOutput<T>>;
    query: <T extends DynamoRecord = DynamoRecord>(input: QueryInput) => Promise<QueryOutput<T>>;
    transactWrite: (input: TransactWriteCommandInput) => Promise<TransactWriteCommandOutput>;
    scanRequest: <T extends DynamoRecord = DynamoRecord>(input: ScanPageInput) => Promise<ScanPageOutput<T>>;
    scanPage: <T extends DynamoRecord = DynamoRecord>(input: ScanPageInput) => Promise<ScanPageOutput<T>>;
    scanAll: <T extends DynamoRecord = DynamoRecord>(input: ScanInput) => Promise<ScanOutput<T>>;
    scan: <T extends DynamoRecord = DynamoRecord>(input: ScanInput) => Promise<ScanOutput<T>>;
    private updateRequest;
    update: <T extends DynamoRecord = DynamoRecord>(input: UpdateInput) => Promise<UpdateOutput<T>>;
    private deleteRequest;
    delete: <T extends DynamoRecord = DynamoRecord>(input: DeleteItemInput) => Promise<DeleteItemOutput<T>>;
    batchGet: <T extends DynamoRecord = DynamoRecord>(tableName: string, keys: DynamoRecord[], options?: BatchGetOptions) => Promise<T[]>;
    private tableSchema;
    private batchDeleteRequest;
    private batchPutRequest;
    truncateAll: (tableName: string, lastEvaluatedKey?: DynamoRecord) => Promise<void>;
    truncate: (tableName: string, records: DynamoRecord[]) => Promise<void>;
    truncateConcurrent: (tableName: string, records: DynamoRecord[], options?: number | TruncateConcurrentOptions) => Promise<void>;
    bulk: (tableName: string, records: DynamoRecord[]) => Promise<void>;
}
export {};
