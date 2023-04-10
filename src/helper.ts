import { DynamoDB, WriteRequest } from '@aws-sdk/client-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  BatchWriteCommand,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  TransactWriteCommandOutput,
  DynamoDBDocument,
} from '@aws-sdk/lib-dynamodb';
import omit from 'lodash/omit';
import { client, documentClient } from './client';
import Logger from './logger';
import { Configurations, Configs } from './configs';

export interface ScanInput extends ScanCommandInput {}

export interface ScanOutput<T = any> extends Omit<ScanCommandOutput, 'Items' | '$metadata'> {
  /**
   * An array of item attributes that match the scan criteria. Each element in this array consists of an attribute name and the value for that attribute.
   */
  Items: T[];
}

export interface GetItemInput extends GetCommandInput {}

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

export interface QueryInput extends QueryCommandInput {}

export interface QueryOutput<T = any> extends Omit<QueryCommandOutput, 'Items' | '$metadata'> {
  /**
   * An array of item attributes that match the query criteria. Each element in this array consists of an attribute name and the value for that attribute.
   */
  Items: T[];
}

export interface UpdateInput extends UpdateCommandInput {}

export interface UpdateOutput<T = any> extends Omit<UpdateCommandOutput, 'Attributes'> {
  /**
   * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
   */
  Attributes?: T;
}

export interface DeleteItemInput extends DeleteCommandInput {}

export interface DeleteItemOutput<T = any> extends Omit<DeleteCommandOutput, 'Attributes' | '$metadata'> {
  /**
   * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
   */
  Attributes?: T;
}

export class DynamodbHelper {
  /** client instance */
  configs: Configs = new Configs();
  docClient: DynamoDBDocument | undefined;
  client: DynamoDB | undefined;

  constructor(configs?: Configurations) {
    if (configs) {
      this.configs.update(configs);
    }
  }

  /** dynamodb client */
  getDocumentClient = () => {
    if (!this.docClient) {
      this.docClient = documentClient(this.configs.getOptions());
    }

    return this.docClient;
  };

  /** dynamodb client */
  getClient = () => {
    if (!this.client) {
      this.client = client(this.configs.getOptions());
    }

    return this.client;
  };

  /** Get */
  private getRequest = (input: GetItemInput): Promise<GetCommandOutput> => {
    Logger.debug('dynamodb get item start...', input);

    const command = new GetCommand(input);

    return this.getDocumentClient().send(command);
  };

  /**
   *
   */
  get = async <T = any>(input: GetItemInput): Promise<GetItemOutput<T> | undefined> => {
    try {
      const result = await this.getRequest(input);

      // データが存在しない
      if (!result.Item) return;

      Logger.debug('dynamodb get item success.', input);
      Logger.debug('Dynamodb ConsumedCapacity: ', result.ConsumedCapacity);
      Logger.debug('Dynamodb item: ', JSON.stringify(result.Item));

      return {
        ...omit(result, ['$metadata']),
        Item: result.Item as T,
      };
    } catch (err) {
      Logger.error('dynamodb get item error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** Put */
  private putRequest = <T extends Record<string, any>>(input: PutItemInput<T>): Promise<PutItemOutput> => {
    Logger.debug('dynamodb put item start...', input);

    const command = new PutCommand({
      ...input,
      Item: input.Item,
    });

    return this.getDocumentClient().send(command);
  };

  /** Put item */
  put = async <T extends Record<string, any>>(input: PutItemInput<T>): Promise<PutItemOutput<T>> => {
    try {
      const result = await this.putRequest({ ...input, Item: input.Item });

      Logger.debug('dynamodb put item success.', input);

      return {
        Attributes: result.Attributes as T,
      };
    } catch (err) {
      Logger.error('dynamodb put item error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** Query */
  private queryRequest = async <T = any>(input: QueryInput): Promise<QueryOutput> => {
    Logger.debug('dynamodb query start...', input);

    const command = new QueryCommand(input);

    const results = await this.getDocumentClient().send(command);

    return {
      ...results,
      Items: results.Items as T[],
    };
  };

  /** Query */
  query = async <T = any>(input: QueryInput): Promise<QueryOutput<T>> => {
    try {
      // クエリ実行
      const results = await this.queryRequest(input);

      // 上限ある場合、そのまま終了
      if (input.Limit && input.Limit === results.Count) {
        Logger.info('dynamodb query success.', `Count=${results.Count}`, input);
        Logger.debug('dynamodb query items.', results, results.Items);

        return {
          ...omit(results, ['$metadata']),
          Items: (results.Items ??= []) as T[],
        };
      }

      if (results.LastEvaluatedKey) {
        const lastResult = await this.query<T>({ ...input, ExclusiveStartKey: results.LastEvaluatedKey });

        if (results.Items && lastResult.Items) {
          results.Items = results.Items.concat(lastResult.Items);
        }
        if (results.Count && lastResult.Count) {
          results.Count = results.Count + lastResult.Count;
        }
        if (results.ScannedCount && lastResult.ScannedCount) {
          results.ScannedCount = results.ScannedCount + lastResult.ScannedCount;
        }
      }

      Logger.info('dynamodb query success.', `Count=${results.Count}`, input);
      Logger.debug('dynamodb query items.', results, results.Items);

      // 上限ある場合、そのまま終了
      if (input.Limit && input.Limit === results.Count) {
        return {
          ...omit(results, ['$metadata']),
          Items: (results.Items ??= []) as T[],
        };
      }

      return {
        ...omit(results, ['$metadata']),
        Items: results.Items as T[],
      };
    } catch (err) {
      Logger.error('dynamodb query error.', (err as any).message, input, err);
      throw err;
    }
  };

  transactWrite = async (input: TransactWriteCommandInput): Promise<TransactWriteCommandOutput> => {
    try {
      Logger.debug('dynamodb transactWrite start...', input);

      const command = new TransactWriteCommand(input);

      const result = await this.getDocumentClient().send(command);

      Logger.debug('dynamodb transactWrite success', input);

      return result;
    } catch (err) {
      Logger.error('dynamodb transactWrite error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** Scan */
  scanRequest = async <T = any>(input: ScanInput): Promise<ScanOutput> => {
    Logger.debug('dynamodb scan start...', input);

    const command = new ScanCommand(input);

    const results = await this.getDocumentClient().send(command);

    return {
      ...results,
      Items: results.Items as T[],
    };
  };

  scan = async <T = any>(input: ScanInput): Promise<ScanOutput<T>> => {
    try {
      // クエリ実行
      const results = await this.scanRequest(input);

      Logger.info('dynamodb scan success.', `Count=${results.Count}`, input);
      Logger.debug('dynamodb scan results', results);

      if (results.LastEvaluatedKey) {
        const lastResult = await this.scan<T>({ ...input, ExclusiveStartKey: results.LastEvaluatedKey });

        if (results.Items && lastResult.Items) {
          results.Items = results.Items.concat(lastResult.Items);
        }
        if (results.Count && lastResult.Count) {
          results.Count = results.Count + lastResult.Count;
        }
        if (results.ScannedCount && lastResult.ScannedCount) {
          results.ScannedCount = results.ScannedCount + lastResult.ScannedCount;
        }
      }

      // 検索結果出力
      Logger.debug('dynamodb scan results', results);

      return {
        ...omit(results, ['$metadata']),
        Items: (results.Items ??= []) as T[],
      };
    } catch (err) {
      Logger.error('dynamodb scan error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** Update */
  private updateRequest = (input: UpdateInput): Promise<UpdateCommandOutput> => {
    Logger.debug('dynamodb update start...', input);

    const command = new UpdateCommand(input);

    return this.getDocumentClient().send(command);
  };

  update = async (input: UpdateInput) => {
    try {
      const result = await this.updateRequest(input);

      Logger.debug('dynamodb update success...', input);

      return result;
    } catch (err) {
      Logger.error('dynamodb update error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** Delete */
  private deleteRequest = (input: DeleteItemInput): Promise<DeleteCommandOutput> => {
    Logger.debug('dynamodb delete item input', input);

    const command = new DeleteCommand(input);

    return this.getDocumentClient().send(command);
  };

  delete = async <T = any>(input: DeleteItemInput): Promise<DeleteItemOutput<T>> => {
    try {
      Logger.debug('dynamodb delete start...', {
        TABLE_NAME: input.TableName,
      });

      const result = await this.deleteRequest(input);

      Logger.debug('dynamodb delete success...', {
        TABLE_NAME: input.TableName,
      });

      return {
        ...omit(result, ['$metadata']),
        Attributes: result.Attributes as T,
      };
    } catch (err) {
      Logger.error('dynamodb delete error.', (err as any).message, input, err);
      throw err;
    }
  };

  /** テーブル情報を取得する */
  private tableSchema = async (tableName: string) => {
    const table = await this.getClient().describeTable({
      TableName: tableName,
    });

    // 存在チェック
    if (!table.Table || !table.Table.KeySchema) {
      throw new Error(`Table is not exists. ${tableName}`);
    }

    return table.Table.KeySchema;
  };

  /** バッチ削除リクエストを作成 */
  private batchDeleteRequest = async (
    tableName: string,
    records: Record<string, NativeAttributeValue>[]
  ): Promise<WriteRequest[][]> => {
    // テーブル情報を取得する
    const keySchema = await this.tableSchema(tableName);

    const keys = keySchema.map((item: any) => item.AttributeName);
    const requests: WriteRequest[][] = [];
    const writeRequests: WriteRequest[] = [];

    // リクエストを作成する
    for (let idx = 0; idx < records.length; idx = idx + 1) {
      const item = records[idx];

      const keyItem: { [key: string]: any } = {};
      // Primary key
      keys.forEach((key) => {
        keyItem[key] = item[key];
      });

      writeRequests.push({
        DeleteRequest: {
          Key: keyItem,
        },
      });

      // 25件ごと、requestを作成する
      if (writeRequests.length === 25) {
        requests.push([...writeRequests]);
        writeRequests.length = 0;
      }
    }

    // 最後の件も追加する
    if (writeRequests.length > 0) {
      requests.push([...writeRequests]);
    }

    return requests;
  };

  /** バッチ登録リクエストを作成 */
  private batchPutRequest = (records: Record<string, NativeAttributeValue>[]) => {
    if (records.length === 0) return [];

    const requests: WriteRequest[][] = [];
    const writeRequests: WriteRequest[] = [];

    // リクエストを作成する
    for (let idx = 0; idx < records.length; idx = idx + 1) {
      const item = records[idx];

      writeRequests.push({
        PutRequest: {
          Item: item,
        },
      });

      // 25件ごと、requestを作成する
      if (writeRequests.length === 25) {
        requests.push([...writeRequests]);
        writeRequests.length = 0;
      }
    }

    // 最後の件も追加する
    if (writeRequests.length > 0) {
      requests.push([...writeRequests]);
    }

    return requests;
  };

  /** バッチリクエストを実行する */
  private process = async (tableName: string, requests: WriteRequest[][]) => {
    if (requests.length === 0) return;

    const tasks = requests.map(
      (item, idx) =>
        new Promise<void>(async (resolve) => {
          Logger.debug(`Queue${idx + 1}, in flight items: ${item.length}`);

          let unprocessed: Record<string, WriteRequest[]> = {
            [tableName]: item,
          };

          for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0; ) {
            const command = new BatchWriteCommand({
              RequestItems: unprocessed,
            });

            const results = await this.getDocumentClient().send(command);

            const items = results.UnprocessedItems;

            // 未処理レコードが存在しない
            if (items === undefined || items[tableName] === undefined || items[tableName].length === 0) {
              resolve();
              return;
            }

            unprocessed = items;
          }
        })
    );

    // delete all
    await Promise.all(tasks);
  };

  /**
   * 一括削除（全件削除）
   */
  truncateAll = async (tableName: string, lastEvaluatedKey?: Record<string, NativeAttributeValue>) => {
    const results = await this.scanRequest({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    // データが存在しない
    if (!results.Items || results.Items.length === 0) return;

    await this.truncate(tableName, results.Items as any);

    if (!lastEvaluatedKey) {
      await this.truncateAll(tableName, lastEvaluatedKey);
    }
  };

  /**
   * 一括削除（一部削除）
   */
  truncate = async (tableName: string, records: Record<string, NativeAttributeValue>[]) => {
    try {
      Logger.debug('dynamodb truncate start...', {
        TABLE_NAME: tableName,
      });

      // リクエスト作成
      const requests = await this.batchDeleteRequest(tableName, records);

      // キューでリクエスト実行
      await this.process(tableName, requests);

      Logger.debug('dynamodb truncate finished...', {
        TABLE_NAME: tableName,
      });
    } catch (err) {
      Logger.error('dynamodb truncate error.', (err as any).message, tableName, err);
      throw err;
    }
  };

  /**
   * 一括登録
   */
  bulk = async (tableName: string, records: Record<string, NativeAttributeValue>[]) => {
    try {
      Logger.debug('dynamodb bulk insert start...', {
        TABLE_NAME: tableName,
      });

      // リクエスト作成
      const requests = this.batchPutRequest(records);
      // キューでリクエスト実行
      await this.process(tableName, requests);

      Logger.debug('dynamodb bulk insert finished...', {
        TABLE_NAME: tableName,
      });
    } catch (err) {
      Logger.error('dynamodb truncate error.', (err as any).message, tableName, err);
      throw err;
    }
  };
}
