import { DynamoDB } from 'aws-sdk';
import { client, documentClient } from './client';
import Logger from './logger';
import { Configurations, config } from './config';

export class Helper {
  /** client instance */
  private configs?: Configurations;

  constructor(configs?: Configurations) {
    this.configs = configs;

    if (configs) {
      config.update(configs);
    }
  }

  private getDocumentClient = () => {
    if (!this.configs || !this.configs.options) return documentClient();

    return documentClient(this.configs.options);
  };

  private getClient = () => {
    if (!this.configs || !this.configs.options) return client();

    return client(this.configs.options);
  };

  /**
   *
   */
  get = async (input: DynamoDB.DocumentClient.GetItemInput): Promise<DynamoDB.DocumentClient.GetItemOutput | undefined> => {
    Logger.info('DynamoDB get item input', input);

    try {
      const result = await this.getDocumentClient()
        .get(input)
        .promise();

      // データが存在しない
      if (!result.Item) return;

      // 返却値設定
      const ret: DynamoDB.DocumentClient.GetItemOutput = {
        ConsumedCapacity: result.ConsumedCapacity,
        Item: result.Item,
      };

      Logger.info('DynamoDB get item success.');
      Logger.debug('DynamoDB item: ', ret);

      return ret;
    } catch (err) {
      Logger.error('DynamoDB get item error.', err.message, err);
      throw err;
    }
  };

  /** Query */
  queryRequest = (input: DynamoDB.DocumentClient.QueryInput) => {
    Logger.info('DynamoDB query input', input);

    return this.getDocumentClient().query(input);
  };

  /** Query */
  query = async (input: DynamoDB.DocumentClient.QueryInput) => {
    // クエリ実行
    const result = await this.queryRequest(input).promise();

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === result.Count) {
      Logger.info('DynamoDB query success.', `Count=${result.Count}`);
      Logger.debug('DynamoDB query items.', result, result.Items);

      return result;
    }

    if (result.LastEvaluatedKey) {
      const lastResult = await this.query({ ...input, ExclusiveStartKey: result.LastEvaluatedKey });

      if (result.Items && lastResult.Items) {
        result.Items = result.Items.concat(lastResult.Items);
      }
      if (result.Count && lastResult.Count) {
        result.Count = result.Count + lastResult.Count;
      }
      if (result.ScannedCount && lastResult.ScannedCount) {
        result.ScannedCount = result.ScannedCount + lastResult.ScannedCount;
      }
    }

    Logger.info('DynamoDB query success.', `Count=${result.Count}`);
    Logger.debug('DynamoDB query items.', result, result.Items);

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === result.Count) {
      return result;
    }

    return result;
  };

  transactWrite = async (input: DynamoDB.DocumentClient.TransactWriteItemsInput): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> => {
    Logger.info('Dynamodb transactWrite input', JSON.stringify(input));

    const result = await this.getDocumentClient()
      .transactWrite(input)
      .promise();

    Logger.info('Dynamodb transactWrite success');

    return {
      ConsumedCapacity: result.ConsumedCapacity,
      ItemCollectionMetrics: result.ItemCollectionMetrics,
    };
  };

  /** Scan */
  scanRequest = (input: DynamoDB.DocumentClient.ScanInput) => {
    Logger.info('DynamoDB scan input', input);

    return this.getDocumentClient().scan(input);
  };

  scan = async (input: DynamoDB.DocumentClient.ScanInput) => {
    // クエリ実行
    const results = await this.scanRequest(input).promise();

    Logger.info(`DynamoDB scan success. LastEvaluatedKey: ${results.LastEvaluatedKey}`, results);

    if (results.LastEvaluatedKey) {
      const lastResult = await this.scan({ ...input, ExclusiveStartKey: results.LastEvaluatedKey });

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

    return results;
  };

  /** Update */
  updateRequest = (input: DynamoDB.DocumentClient.UpdateItemInput) => {
    Logger.info('Dynamodb update item input', input);

    return this.getDocumentClient().update(input);
  };

  update = async (input: DynamoDB.DocumentClient.UpdateItemInput) => {
    const result = await this.updateRequest(input).promise();

    Logger.info('DynamoDB update success.');

    return result;
  };

  /** Delete */
  deleteRequest = (input: DynamoDB.DocumentClient.DeleteItemInput) => {
    Logger.info('Dynamodb delete item input', input);

    return this.getDocumentClient().delete(input);
  };

  delete = async (input: DynamoDB.DocumentClient.DeleteItemInput) => {
    const result = await this.deleteRequest(input).promise();

    Logger.info('DynamoDB delete success.');

    return result;
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
      keys.forEach(key => {
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
        new Promise(async resolve => {
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
    if (!values.Items) return;

    return await this.truncate(tableName, values.Items);
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
