import { DynamoDB } from 'aws-sdk';
import { client as createClient } from './client';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { logger, info, debug } from './utils';

export interface Configurations {
  xray?: boolean;
  options?: DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;
  loggerLevel?: string;
}

export default class DynamodbHelper {
  configs: Configurations;
  /** client instance */
  client = createClient(this.configs);

  constructor(configs: Configurations = { xray: true, loggerLevel: 'info' }) {
    this.configs = configs;

    if (configs.loggerLevel) {
      logger.level = configs.loggerLevel;
    }
  }

  /**
   *
   */
  get = async (input: DynamoDB.DocumentClient.GetItemInput): Promise<DynamoDB.DocumentClient.GetItemOutput | undefined> => {
    info('Get item input', input);

    let ret: DynamoDB.DocumentClient.GetItemOutput | undefined;

    try {
      const result = await this.client.get(input).promise();

      // データが存在しない
      if (!result.Item) return;

      // 返却値設定
      ret = {
        ConsumedCapacity: result.ConsumedCapacity,
        Item: result.Item,
      };

      info('Get item success.');
      debug('Get item success', ret);

      return ret;
    } catch (err) {
      console.log(err);
      return;
    } finally {
      console.log('Dynamodb get item result: ', ret);
    }
  };

  /** Query */
  querySync = (input: DynamoDB.DocumentClient.QueryInput) => {
    info('Query input', input);

    return this.client.query(input);
  };

  /** Query */
  query = async (input: DynamoDB.DocumentClient.QueryInput) => {
    // クエリ実行
    const result = await this.querySync(input).promise();

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === result.Count) {
      info(`Query success. Item count: ${result.Count}.`);
      debug('Query success.', result);

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

    info(`Query success. Item count: ${result.Count}.`);
    debug('Query success.', result);

    // 上限ある場合、そのまま終了
    if (input.Limit && input.Limit === result.Count) {
      return result;
    }

    return result;
  };

  transactWrite = async (input: DynamoDB.DocumentClient.TransactWriteItemsInput): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> => {
    console.log('Dynamodb transactWrite: ', JSON.stringify(input));

    const ret = await this.client.transactWrite(input).promise();

    return {
      ConsumedCapacity: ret.ConsumedCapacity,
      ItemCollectionMetrics: ret.ItemCollectionMetrics,
    };
  };

  /** Scan */
  scanSync = (input: DynamoDB.DocumentClient.ScanInput) => {
    info('Scan input', input);

    return this.client.scan(input);
  };

  scan = async (input: DynamoDB.DocumentClient.ScanInput) => {
    // クエリ実行
    const result = await this.scanSync(input).promise();

    // 検索結果出力
    console.log(result);

    if (result.LastEvaluatedKey) {
      const lastResult = await this.scan({ ...input, ExclusiveStartKey: result.LastEvaluatedKey });

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

    return result;
  };

  /** Update */
  updateSync = (input: DynamoDB.DocumentClient.UpdateItemInput) => {
    info('Dynamodb update item input', input);

    return this.client.update(input);
  };

  update = async (input: DynamoDB.DocumentClient.UpdateItemInput) => {
    const result = await this.updateSync(input).promise();

    console.log(result);

    return result;
  };

  /** Delete */
  deleteItemSync = (input: DynamoDB.DocumentClient.DeleteItemInput) => {
    info('Dynamodb delete item input', input);

    return this.client.delete(input);
  };

  deleteItem = async (input: DynamoDB.DocumentClient.DeleteItemInput) => {
    const result = await this.deleteItemSync(input).promise();

    console.log(result);

    return result;
  };

  /** テーブル情報を取得する */
  getTableSchema = async (tableName: string) => {
    const table = await this.client
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
  getDeleteRequest = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    // テーブル情報を取得する
    const keySchema = await this.getTableSchema(tableName);

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
  getPutRequest = async (records: DynamoDB.DocumentClient.AttributeMap[]) => {
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
  process = async (tableName: string, requests: DynamoDB.DocumentClient.WriteRequests[]) => {
    const tasks = requests.map(
      (item, idx) =>
        new Promise(async resolve => {
          console.log(`Queue${idx + 1}, in flight items: ${item.length}`);

          let unprocessed: DynamoDB.DocumentClient.BatchWriteItemRequestMap = {
            [tableName]: item,
          };

          // tslint:disable-next-line: space-in-parens
          for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0; ) {
            const results = await this.client
              .batchWrite({
                RequestItems: unprocessed,
              })
              .promise();

            // 処理対象がない
            if (!results.UnprocessedItems) {
              console.log(`Queue${idx + 1}, delete complete.`);

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

  truncateAll = async (tableName: string) => {
    const values = await this.scan({
      TableName: tableName,
    });

    // データが存在しない
    if (!values.Items) return;

    return await this.truncate(tableName, values.Items);
  };

  /** テーブルデータ一括削除 */
  truncate = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    console.log(`Truncate start... ${tableName}`);
    // リクエスト作成
    const requests = await this.getDeleteRequest(tableName, records);
    // キューでリクエスト実行
    await this.process(tableName, requests);

    console.log(`Truncate end... ${tableName}`);
  };

  /** テーブルデータ一括登録 */
  bulk = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
    console.log(`Bulk insert start... ${tableName}`);

    console.log(records);
    // リクエスト作成
    const requests = await this.getPutRequest(records);
    // キューでリクエスト実行
    await this.process(tableName, requests);

    console.log(`Bulk insert end... ${tableName}`);
  };
}

// import { DynamoDB } from 'aws-sdk';
// import { dynamoDB, dynamoDB2 } from './clientUtils';
