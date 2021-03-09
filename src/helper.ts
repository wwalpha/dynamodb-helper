import { DynamoDB } from 'aws-sdk';
import omit from 'lodash/omit';
import { client, documentClient } from './client';
import Logger from './logger';
import { Configurations, Configs } from './configs';

export interface AttributeMap extends DynamoDB.DocumentClient.AttributeMap {}

export interface ScanInput extends DynamoDB.DocumentClient.ScanInput {}

export interface ScanOutput<T = any> extends DynamoDB.DocumentClient.ScanOutput {
  /**
   * An array of item attributes that match the scan criteria. Each element in this array consists of an attribute name and the value for that attribute.
   */
  Items?: T[];
}

export interface GetItemInput extends DynamoDB.DocumentClient.GetItemInput {}

export interface GetItemOutput<T = any> extends DynamoDB.DocumentClient.GetItemOutput {
  /**
   * A map of attribute names to AttributeValue objects, as specified by ProjectionExpression.
   */
  Item?: T;
}

export interface PutItemInput extends DynamoDB.DocumentClient.PutItemInput {}

export interface PutItemOutput<T = any> extends DynamoDB.DocumentClient.PutItemOutput {
  /**
   * The attribute values as they appeared before the PutItem operation, but only if ReturnValues is specified as ALL_OLD in the request. Each element consists of an attribute name and an attribute value.
   */
  Attributes?: T;
}

export interface QueryInput extends DynamoDB.DocumentClient.QueryInput {}

export interface QueryOutput<T = any> extends DynamoDB.DocumentClient.QueryOutput {
  /**
   * An array of item attributes that match the query criteria. Each element in this array consists of an attribute name and the value for that attribute.
   */
  Items?: T[];
}

export interface UpdateItemInput extends DynamoDB.DocumentClient.UpdateItemInput {}

export interface UpdateItemOutput<T = any> extends DynamoDB.DocumentClient.UpdateItemOutput {
  /**
   * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
   */
  Attributes?: T;
}

export interface DeleteItemInput extends DynamoDB.DocumentClient.DeleteItemInput {}

export interface DeleteItemOutput<T = any> extends DynamoDB.DocumentClient.DeleteItemOutput {
  /**
   * A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter. The Attributes map is only present if ReturnValues was specified as something other than NONE in the request. Each element represents one attribute.
   */
  Attributes?: T;
}

export class DynamodbHelper {
  /** client instance */
  configs: Configs = new Configs();

  constructor(configs?: Configurations) {
    if (configs) {
      this.configs.update(configs);
    }
  }

  /** dynamodb document client */
  getDocumentClient = (): DynamoDB.DocumentClient => {
    return documentClient(this.configs.getOptions());
  };

  /** dynamodb client */
  getClient = () => {
    return client(this.configs.getOptions());
  };

  /** Get */
  getRequest = (input: GetItemInput) => {
    Logger.info('DynamoDB get item input', input);

    return this.getDocumentClient().get(input);
  };

  /**
   *
   */
  get = async <T = any>(input: GetItemInput): Promise<GetItemOutput<T> | undefined> => {
    try {
      const result = await this.getRequest(input).promise();

      // データが存在しない
      if (!result.Item) return;

      // 返却値設定
      const ret: DynamoDB.DocumentClient.GetItemOutput = {
        ConsumedCapacity: result.ConsumedCapacity,
        Item: result.Item,
      };

      Logger.info('DynamoDB get item success.');
      Logger.debug('DynamoDB item: ', ret);

      return {
        ...omit(result, ['$response']),
        Item: result.Item as T,
      };
    } catch (err) {
      Logger.error('DynamoDB get item error.', err.message, err);
      throw err;
    }
  };

  /** Put */
  putRequest = (input: PutItemInput) => {
    Logger.info('DynamoDB put item input', input);

    return this.getDocumentClient().put(input);
  };

  /** put item */
  put = async <T = any>(input: PutItemInput): Promise<PutItemOutput<T>> => {
    const result = await this.putRequest(input).promise();

    Logger.info('DynamoDB put item success.');

    return {
      ...omit(result, ['$response']),
      Attributes: result.Attributes as T,
    };
  };

  /** Query */
  queryRequest = (input: QueryInput) => {
    Logger.info('DynamoDB query input', input);

    return this.getDocumentClient().query(input);
  };

  /** Query */
  query = async <T = any>(input: QueryInput): Promise<QueryOutput<T>> => {
    // クエリ実行
    const results = await this.queryRequest(input).promise();

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === results.Count) {
      Logger.info('DynamoDB query success.', `Count=${results.Count}`);
      Logger.debug('DynamoDB query items.', results, results.Items);

      return {
        ...omit(results, ['$response']),
        Items: results.Items as T[],
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

    Logger.info('DynamoDB query success.', `Count=${results.Count}`);
    Logger.debug('DynamoDB query items.', results, results.Items);

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === results.Count) {
      return {
        ...omit(results, ['$response']),
        Items: results.Items as T[],
      };
    }

    return {
      ...omit(results, ['$response']),
      Items: results.Items as T[],
    };
  };

  transactWrite = async (
    input: DynamoDB.DocumentClient.TransactWriteItemsInput
  ): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> => {
    Logger.info('Dynamodb transactWrite input', JSON.stringify(input));

    const result = await this.getDocumentClient().transactWrite(input).promise();

    Logger.info('Dynamodb transactWrite success');

    return {
      ConsumedCapacity: result.ConsumedCapacity,
      ItemCollectionMetrics: result.ItemCollectionMetrics,
    };
  };

  /** Scan */
  scanRequest = (input: ScanInput) => {
    Logger.info('DynamoDB scan input', input);

    return this.getDocumentClient().scan(input);
  };

  scan = async <T = any>(input: ScanInput): Promise<ScanOutput<T>> => {
    // クエリ実行
    const results = await this.scanRequest(input).promise();

    Logger.info(`DynamoDB scan success. LastEvaluatedKey: ${results.LastEvaluatedKey}`, results);

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
    Logger.debug('DynamoDB scan results', results);

    return {
      ...omit(results, ['$response']),
      Items: results.Items as T[],
    };
  };

  /** Update */
  updateRequest = (input: UpdateItemInput) => {
    Logger.info('Dynamodb update item input', input);

    return this.getDocumentClient().update(input);
  };

  update = async (input: UpdateItemInput) => {
    const result = await this.updateRequest(input).promise();

    Logger.info('DynamoDB update success.');

    return result;
  };

  /** Delete */
  deleteRequest = (input: DeleteItemInput) => {
    Logger.info('Dynamodb delete item input', input);

    return this.getDocumentClient().delete(input);
  };

  delete = async <T = any>(input: DeleteItemInput): Promise<DeleteItemOutput<T>> => {
    const result = await this.deleteRequest(input).promise();

    Logger.info('DynamoDB delete success.');

    return {
      ...omit(result, ['$response']),
      Attributes: result.Attributes as T,
    };
  };

  /** テーブル情報を取得する */
  private tableSchema = async (tableName: string) => {
    const table = await this.getClient()
      .describeTable({
        TableName: tableName,
      })
      .promise();

    // 存在チェック
    if (!table.Table || !table.Table.KeySchema) {
      throw new Error('Table is not exists.');
    }

    return table.Table.KeySchema;
  };

  /** バッチ削除リクエストを作成 */
  private batchDeleteRequest = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    // テーブル情報を取得する
    const keySchema = await this.tableSchema(tableName);

    const keys = keySchema.map((item: any) => item.AttributeName);
    const requests: DynamoDB.DocumentClient.WriteRequests[] = [];
    const writeRequests: DynamoDB.DocumentClient.WriteRequests = [];

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
    requests.push([...writeRequests]);

    return requests;
  };

  /** バッチ登録リクエストを作成 */
  private batchPutRequest = (records: DynamoDB.DocumentClient.AttributeMap[]) => {
    const requests: DynamoDB.DocumentClient.WriteRequests[] = [];
    const writeRequests: DynamoDB.DocumentClient.WriteRequests = [];

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
    requests.push([...writeRequests]);

    return requests;
  };

  /** バッチリクエストを実行する */
  private process = async (tableName: string, requests: DynamoDB.DocumentClient.WriteRequests[]) => {
    const tasks = requests.map(
      (item, idx) =>
        new Promise<void>(async (resolve) => {
          Logger.debug(`Queue${idx + 1}, in flight items: ${item.length}`);

          let unprocessed: DynamoDB.DocumentClient.BatchWriteItemRequestMap = {
            [tableName]: item,
          };

          // tslint:disable-next-line: space-in-parens
          for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0; ) {
            const results = await this.getDocumentClient()
              .batchWrite({
                RequestItems: unprocessed,
              })
              .promise();

            // 処理対象がない
            if (!results.UnprocessedItems) {
              Logger.debug(`Queue${idx + 1}, process complete.`);

              break;
            }

            unprocessed = results.UnprocessedItems;
          }

          resolve();
        })
    );

    // delete all
    await Promise.all(tasks);
  };

  /**
   * 一括削除（全件削除）
   */
  truncateAll = async (tableName: string) => {
    const values = await this.scan({
      TableName: tableName,
    });

    // データが存在しない
    if (!values?.Items) return;

    return await this.truncate(tableName, values?.Items as any);
  };

  /**
   * 一括削除（一部削除）
   */
  truncate = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    Logger.info(`DynamoDB truncate start... ${tableName}`);

    // リクエスト作成
    const requests = await this.batchDeleteRequest(tableName, records);
    // キューでリクエスト実行
    await this.process(tableName, requests);

    Logger.info(`DynamoDB truncate finished... ${tableName}`);
  };

  /**
   * 一括登録
   */
  bulk = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    Logger.info(`DynamoDB bulk insert start... ${tableName}`);
    Logger.debug(`DynamoDB bulk insert records`, records);

    // リクエスト作成
    const requests = this.batchPutRequest(records);
    // キューでリクエスト実行
    await this.process(tableName, requests);

    Logger.info(`DynamoDB bulk insert finished... ${tableName}`);
  };
}
