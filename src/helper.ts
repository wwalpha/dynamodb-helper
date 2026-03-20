import { DescribeTableCommand, DynamoDBClient, KeySchemaElement, WriteRequest } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import {
  BatchGetCommand,
  BatchGetCommandInput,
  BatchWriteCommand,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  TransactWriteCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import omit from 'lodash/omit';
import { client, documentClient } from './client';
import { Configurations, Configs } from './configs';
import Logger from './logger';

export type DynamoRecord = Record<string, NativeAttributeValue>;

type CommandOutputWithoutMetadata<O> = Omit<O, '$metadata'>;
type ResultWithItems<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Items'> & { Items: T[] };
type ResultWithOptionalItem<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Item'> & { Item?: T };
type ResultWithOptionalAttributes<O, T> = Omit<CommandOutputWithoutMetadata<O>, 'Attributes'> & { Attributes?: T };
type PageResult<T> = {
  Count?: number;
  Items?: T[];
  LastEvaluatedKey?: DynamoRecord;
  ScannedCount?: number;
};

const BATCH_GET_LIMIT = 100;
const BATCH_WRITE_LIMIT = 25;
const DEFAULT_BATCH_RETRIES = 5;
const DEFAULT_BULK_CONCURRENCY = 4;
const DEFAULT_TRUNCATE_CONCURRENCY = 4;

export interface ScanInput extends ScanCommandInput {}

export type ScanOutput<T = DynamoRecord> = ResultWithItems<ScanCommandOutput, T>;

export interface ScanPageInput extends ScanCommandInput {}

export type ScanPageOutput<T = DynamoRecord> = ResultWithItems<ScanCommandOutput, T>;

export interface GetItemInput extends GetCommandInput {}

export type GetItemOutput<T = DynamoRecord> = ResultWithOptionalItem<GetCommandOutput, T>;

export interface PutItemInput<T extends DynamoRecord> extends PutCommandInput {
  Item: T;
}

export type PutItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<PutCommandOutput, T>;

export interface QueryInput extends QueryCommandInput {}

export type QueryOutput<T = DynamoRecord> = ResultWithItems<QueryCommandOutput, T>;

export interface QueryPageInput extends QueryCommandInput {}

export type QueryPageOutput<T = DynamoRecord> = ResultWithItems<QueryCommandOutput, T>;

export interface UpdateInput extends UpdateCommandInput {}

export type UpdateOutput<T = DynamoRecord> = ResultWithOptionalAttributes<UpdateCommandOutput, T>;

export interface DeleteItemInput extends DeleteCommandInput {}

export type DeleteItemOutput<T = DynamoRecord> = ResultWithOptionalAttributes<DeleteCommandOutput, T>;

export interface BatchGetOptions extends Omit<BatchGetCommandInput, 'RequestItems'> {
  maxRetries?: number;
}

export interface TruncateConcurrentOptions {
  concurrency?: number;
  maxRetries?: number;
}

export class DynamodbHelper {
  configs: Configs = new Configs();
  docClient: DynamoDBDocument | undefined;
  client: DynamoDBClient | undefined;

  constructor(configs?: Configurations) {
    if (configs) {
      this.configs.update(configs);
    }
  }

  getDocumentClient = () => {
    if (!this.docClient) {
      this.docClient = documentClient(this.configs.getOptions());
    }

    return this.docClient;
  };

  getClient = () => {
    if (!this.client) {
      this.client = client(this.configs.getOptions());
    }

    return this.client;
  };

  private stripMetadata = <O extends object | null | undefined>(result: O): CommandOutputWithoutMetadata<O> =>
    omit(result, ['$metadata']) as CommandOutputWithoutMetadata<O>;

  private splitIntoChunks = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  };

  private collectAllPages = async <
    T,
    I extends { ExclusiveStartKey?: DynamoRecord; Limit?: number },
    O extends PageResult<T>,
  >(
    input: I,
    requestPage: (pageInput: I) => Promise<O>,
  ): Promise<
    Omit<CommandOutputWithoutMetadata<O>, 'Items' | 'Count' | 'ScannedCount'> & {
      Count: number;
      Items: T[];
      ScannedCount?: number;
    }
  > => {
    const items: T[] = [];
    const totalLimit = input.Limit;
    let accumulatedScannedCount = 0;
    let lastPage: O | undefined;
    let nextStartKey = input.ExclusiveStartKey;
    let hasNextPage = true;

    while (hasNextPage) {
      const remainingLimit = totalLimit === undefined ? undefined : Math.max(totalLimit - items.length, 0);

      if (remainingLimit === 0) {
        break;
      }

      const pageInput = {
        ...input,
        ExclusiveStartKey: nextStartKey,
        ...(remainingLimit === undefined ? {} : { Limit: remainingLimit }),
      } as I;

      lastPage = await requestPage(pageInput);
      items.push(...(lastPage.Items ?? []));
      accumulatedScannedCount += lastPage.ScannedCount ?? 0;
      nextStartKey = lastPage.LastEvaluatedKey;
      hasNextPage = Boolean(nextStartKey);

      if (totalLimit !== undefined && items.length >= totalLimit) {
        break;
      }
    }

    return {
      ...(this.stripMetadata(lastPage ?? ({} as O)) as Omit<
        CommandOutputWithoutMetadata<O>,
        'Items' | 'Count' | 'ScannedCount'
      >),
      Count: items.length,
      Items: items,
      LastEvaluatedKey: nextStartKey,
      ...(lastPage && lastPage.ScannedCount !== undefined ? { ScannedCount: accumulatedScannedCount } : {}),
    };
  };

  private processWriteBatch = async (tableName: string, writeRequests: WriteRequest[], maxRetries: number) => {
    let pendingItems = writeRequests;

    for (let attempt = 0; pendingItems.length > 0; attempt += 1) {
      const result = await this.getDocumentClient().send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: pendingItems,
          },
        }),
      );

      pendingItems = result.UnprocessedItems?.[tableName] ?? [];

      if (pendingItems.length === 0) {
        return;
      }

      if (attempt >= maxRetries) {
        throw new Error(`BatchWrite exceeded retry limit for ${tableName}. UnprocessedItems=${pendingItems.length}`);
      }
    }
  };

  private processWriteRequests = async (
    tableName: string,
    requests: WriteRequest[][],
    concurrency: number,
    maxRetries: number,
  ) => {
    if (requests.length === 0) {
      return;
    }

    const workerCount = Math.max(1, Math.min(concurrency, requests.length));
    let nextIndex = 0;

    const runWorker = async () => {
      while (nextIndex < requests.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;

        await this.processWriteBatch(tableName, requests[currentIndex], maxRetries);
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  };

  private getRequest = (input: GetItemInput): Promise<GetCommandOutput> => {
    Logger.debug('dynamodb get item start...', input);

    return this.getDocumentClient().send(new GetCommand(input));
  };

  get = async <T extends DynamoRecord = DynamoRecord>(input: GetItemInput): Promise<GetItemOutput<T> | undefined> => {
    try {
      const result = await this.getRequest(input);

      if (!result.Item) {
        return;
      }

      Logger.debug('dynamodb get item success.', input);

      return {
        ...this.stripMetadata(result),
        Item: result.Item as T,
      };
    } catch (err) {
      Logger.error('dynamodb get item error.', (err as Error).message, input, err);
      throw err;
    }
  };

  private putRequest = <T extends DynamoRecord>(input: PutItemInput<T>): Promise<PutCommandOutput> => {
    Logger.debug('dynamodb put item start...', input);

    return this.getDocumentClient().send(new PutCommand(input));
  };

  put = async <T extends DynamoRecord>(input: PutItemInput<T>): Promise<PutItemOutput<T>> => {
    try {
      const result = await this.putRequest(input);

      Logger.debug('dynamodb put item success.', input);

      return {
        ...this.stripMetadata(result),
        Attributes: result.Attributes as T,
      };
    } catch (err) {
      Logger.error('dynamodb put item error.', (err as Error).message, input, err);
      throw err;
    }
  };

  private queryRequest = async <T extends DynamoRecord = DynamoRecord>(
    input: QueryPageInput,
  ): Promise<QueryPageOutput<T>> => {
    Logger.debug('dynamodb query page start...', JSON.stringify(input));

    const result = await this.getDocumentClient().send(new QueryCommand(input));

    return {
      ...this.stripMetadata(result),
      Items: (result.Items ?? []) as T[],
    };
  };

  queryPage = async <T extends DynamoRecord = DynamoRecord>(input: QueryPageInput): Promise<QueryPageOutput<T>> => {
    try {
      const result = await this.queryRequest<T>(input);

      Logger.info('dynamodb query page success.', `Count=${result.Count ?? result.Items.length}`, input);

      return result;
    } catch (err) {
      Logger.error('dynamodb query page error.', (err as Error).message, input, err);
      throw err;
    }
  };

  queryAll = async <T extends DynamoRecord = DynamoRecord>(input: QueryInput): Promise<QueryOutput<T>> => {
    try {
      const result = await this.collectAllPages<T, QueryInput, QueryPageOutput<T>>(input, (pageInput) =>
        this.queryRequest<T>(pageInput),
      );

      Logger.info('dynamodb query success.', `Count=${result.Count}`, input);

      return result;
    } catch (err) {
      Logger.error('dynamodb query error.', (err as Error).message, input, err);
      throw err;
    }
  };

  query = async <T extends DynamoRecord = DynamoRecord>(input: QueryInput): Promise<QueryOutput<T>> =>
    this.queryAll<T>(input);

  transactWrite = async (input: TransactWriteCommandInput): Promise<TransactWriteCommandOutput> => {
    try {
      Logger.debug('dynamodb transactWrite start...', input);

      const result = await this.getDocumentClient().send(new TransactWriteCommand(input));

      Logger.debug('dynamodb transactWrite success', input);

      return result;
    } catch (err) {
      Logger.error('dynamodb transactWrite error.', (err as Error).message, input, err);
      throw err;
    }
  };

  scanRequest = async <T extends DynamoRecord = DynamoRecord>(input: ScanPageInput): Promise<ScanPageOutput<T>> => {
    Logger.debug('dynamodb scan page start...', input);

    const result = await this.getDocumentClient().send(new ScanCommand(input));

    return {
      ...this.stripMetadata(result),
      Items: (result.Items ?? []) as T[],
    };
  };

  scanPage = async <T extends DynamoRecord = DynamoRecord>(input: ScanPageInput): Promise<ScanPageOutput<T>> => {
    try {
      const result = await this.scanRequest<T>(input);

      Logger.info('dynamodb scan page success.', `Count=${result.Count ?? result.Items.length}`, input);

      return result;
    } catch (err) {
      Logger.error('dynamodb scan page error.', (err as Error).message, input, err);
      throw err;
    }
  };

  scanAll = async <T extends DynamoRecord = DynamoRecord>(input: ScanInput): Promise<ScanOutput<T>> => {
    try {
      const result = await this.collectAllPages<T, ScanInput, ScanPageOutput<T>>(input, (pageInput) =>
        this.scanRequest<T>(pageInput),
      );

      Logger.info('dynamodb scan success.', `Count=${result.Count}`, input);

      return result;
    } catch (err) {
      Logger.error('dynamodb scan error.', (err as Error).message, input, err);
      throw err;
    }
  };

  scan = async <T extends DynamoRecord = DynamoRecord>(input: ScanInput): Promise<ScanOutput<T>> =>
    this.scanAll<T>(input);

  private updateRequest = (input: UpdateInput): Promise<UpdateCommandOutput> => {
    Logger.debug('dynamodb update start...', input);

    return this.getDocumentClient().send(new UpdateCommand(input));
  };

  update = async <T extends DynamoRecord = DynamoRecord>(input: UpdateInput): Promise<UpdateOutput<T>> => {
    try {
      const result = await this.updateRequest(input);

      Logger.debug('dynamodb update success...', input);

      return {
        ...this.stripMetadata(result),
        Attributes: result.Attributes as T,
      };
    } catch (err) {
      Logger.error('dynamodb update error.', (err as Error).message, input, err);
      throw err;
    }
  };

  private deleteRequest = (input: DeleteItemInput): Promise<DeleteCommandOutput> => {
    Logger.debug('dynamodb delete item input', input);

    return this.getDocumentClient().send(new DeleteCommand(input));
  };

  delete = async <T extends DynamoRecord = DynamoRecord>(input: DeleteItemInput): Promise<DeleteItemOutput<T>> => {
    try {
      Logger.debug('dynamodb delete start...', {
        TABLE_NAME: input.TableName,
      });

      const result = await this.deleteRequest(input);

      Logger.debug('dynamodb delete success...', {
        TABLE_NAME: input.TableName,
      });

      return {
        ...this.stripMetadata(result),
        Attributes: result.Attributes as T,
      };
    } catch (err) {
      Logger.error('dynamodb delete error.', (err as Error).message, input, err);
      throw err;
    }
  };

  batchGet = async <T extends DynamoRecord = DynamoRecord>(
    tableName: string,
    keys: DynamoRecord[],
    options: BatchGetOptions = {},
  ): Promise<T[]> => {
    const { maxRetries = DEFAULT_BATCH_RETRIES, ...requestOptions } = options;

    if (keys.length === 0) {
      return [];
    }

    const chunks = this.splitIntoChunks(keys, BATCH_GET_LIMIT);
    const items: T[] = [];

    for (const chunk of chunks) {
      let pendingKeys = chunk;

      for (let attempt = 0; pendingKeys.length > 0; attempt += 1) {
        const result = await this.getDocumentClient().send(
          new BatchGetCommand({
            ...requestOptions,
            RequestItems: {
              [tableName]: {
                Keys: pendingKeys,
              },
            },
          }),
        );

        items.push(...((result.Responses?.[tableName] ?? []) as unknown as T[]));
        pendingKeys = (result.UnprocessedKeys?.[tableName]?.Keys ?? []) as DynamoRecord[];

        if (pendingKeys.length === 0) {
          break;
        }

        if (attempt >= maxRetries) {
          throw new Error(`BatchGet exceeded retry limit for ${tableName}. UnprocessedKeys=${pendingKeys.length}`);
        }
      }
    }

    return items;
  };

  private tableSchema = async (tableName: string): Promise<KeySchemaElement[]> => {
    const table = await this.getClient().send(new DescribeTableCommand({ TableName: tableName }));

    if (!table.Table?.KeySchema) {
      throw new Error(`Table does not exist. ${tableName}`);
    }

    return table.Table.KeySchema;
  };

  private batchDeleteRequest = async (tableName: string, records: DynamoRecord[]): Promise<WriteRequest[][]> => {
    const keySchema = await this.tableSchema(tableName);
    const keyNames = keySchema.map((item) => item.AttributeName).filter((item): item is string => Boolean(item));
    const writeRequests = records.map((record) => {
      const key = keyNames.reduce<Record<string, NativeAttributeValue>>((result, keyName) => {
        result[keyName] = record[keyName];
        return result;
      }, {});

      return {
        DeleteRequest: {
          Key: key,
        },
      };
    });

    return this.splitIntoChunks(writeRequests, BATCH_WRITE_LIMIT);
  };

  private batchPutRequest = (records: DynamoRecord[]) => {
    const writeRequests = records.map((record) => ({
      PutRequest: {
        Item: record,
      },
    }));

    return this.splitIntoChunks(writeRequests, BATCH_WRITE_LIMIT);
  };

  truncateAll = async (tableName: string, lastEvaluatedKey?: DynamoRecord) => {
    let nextStartKey = lastEvaluatedKey;

    do {
      const page = await this.scanPage<DynamoRecord>({
        TableName: tableName,
        ExclusiveStartKey: nextStartKey,
      });

      if (page.Items.length > 0) {
        await this.truncate(tableName, page.Items);
      }

      nextStartKey = page.LastEvaluatedKey;
    } while (nextStartKey);
  };

  truncate = async (tableName: string, records: DynamoRecord[]) => {
    try {
      Logger.debug('dynamodb truncate start...', {
        TABLE_NAME: tableName,
      });

      const requests = await this.batchDeleteRequest(tableName, records);

      await this.processWriteRequests(tableName, requests, 1, DEFAULT_BATCH_RETRIES);

      Logger.debug('dynamodb truncate finished...', {
        TABLE_NAME: tableName,
      });
    } catch (err) {
      Logger.error('dynamodb truncate error.', (err as Error).message, tableName, err);
      throw err;
    }
  };

  truncateConcurrent = async (
    tableName: string,
    records: DynamoRecord[],
    options: number | TruncateConcurrentOptions = {},
  ): Promise<void> => {
    const resolvedOptions = typeof options === 'number' ? { concurrency: options } : options;
    const concurrency = resolvedOptions.concurrency ?? DEFAULT_TRUNCATE_CONCURRENCY;
    const maxRetries = resolvedOptions.maxRetries ?? DEFAULT_BATCH_RETRIES;

    try {
      Logger.debug('dynamodb truncate concurrent start...', {
        TABLE_NAME: tableName,
        CONCURRENCY: concurrency,
      });

      const requests = await this.batchDeleteRequest(tableName, records);

      await this.processWriteRequests(tableName, requests, concurrency, maxRetries);

      Logger.debug('dynamodb truncate concurrent finished...', {
        TABLE_NAME: tableName,
        CONCURRENCY: concurrency,
      });
    } catch (err) {
      Logger.error('dynamodb truncate concurrent error.', (err as Error).message, tableName, err);
      throw err;
    }
  };

  bulk = async (tableName: string, records: DynamoRecord[]) => {
    try {
      Logger.debug('dynamodb bulk insert start...', {
        TABLE_NAME: tableName,
      });

      const requests = this.batchPutRequest(records);

      await this.processWriteRequests(tableName, requests, DEFAULT_BULK_CONCURRENCY, DEFAULT_BATCH_RETRIES);

      Logger.debug('dynamodb bulk insert success...', {
        TABLE_NAME: tableName,
      });
    } catch (err) {
      Logger.error('dynamodb bulk insert error.', (err as Error).message, tableName, err);
      throw err;
    }
  };
}
