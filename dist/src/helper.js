"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbHelper = void 0;
const client_1 = require("./client");
const logger_1 = __importDefault(require("./logger"));
const configs_1 = require("./configs");
class DynamodbHelper {
    constructor(configs) {
        /** client instance */
        this.configs = new configs_1.Configs();
        /** dynamodb document client */
        this.getDocumentClient = () => {
            return client_1.documentClient(this.configs.getOptions());
        };
        /** dynamodb client */
        this.getClient = () => {
            return client_1.client(this.configs.getOptions());
        };
        /** Get */
        this.getRequest = (input) => {
            logger_1.default.info('DynamoDB get item input', input);
            return this.getDocumentClient().get(input);
        };
        /**
         *
         */
        this.get = async (input) => {
            try {
                const result = await this.getRequest(input).promise();
                // データが存在しない
                if (!result.Item)
                    return;
                // 返却値設定
                const ret = {
                    ConsumedCapacity: result.ConsumedCapacity,
                    Item: result.Item,
                };
                logger_1.default.info('DynamoDB get item success.');
                logger_1.default.debug('DynamoDB item: ', ret);
                return ret;
            }
            catch (err) {
                logger_1.default.error('DynamoDB get item error.', err.message, err);
                throw err;
            }
        };
        /** Put */
        this.putRequest = (input) => {
            logger_1.default.info('DynamoDB put item input', input);
            return this.getDocumentClient().put(input);
        };
        this.put = async (input) => {
            const result = await this.putRequest(input).promise();
            logger_1.default.info('DynamoDB put item success.');
            return result;
        };
        /** Query */
        this.queryRequest = (input) => {
            logger_1.default.info('DynamoDB query input', input);
            return this.getDocumentClient().query(input);
        };
        /** Query */
        this.query = async (input) => {
            // クエリ実行
            const result = await this.queryRequest(input).promise();
            // 上限ある場合、そのまま終了
            if (input.Limit && input.Limit === result.Count) {
                logger_1.default.info('DynamoDB query success.', `Count=${result.Count}`);
                logger_1.default.debug('DynamoDB query items.', result, result.Items);
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
            logger_1.default.info('DynamoDB query success.', `Count=${result.Count}`);
            logger_1.default.debug('DynamoDB query items.', result, result.Items);
            // 上限ある場合、そのまま終了
            if (input.Limit && input.Limit === result.Count) {
                return result;
            }
            return result;
        };
        this.transactWrite = async (input) => {
            logger_1.default.info('Dynamodb transactWrite input', JSON.stringify(input));
            const result = await this.getDocumentClient().transactWrite(input).promise();
            logger_1.default.info('Dynamodb transactWrite success');
            return {
                ConsumedCapacity: result.ConsumedCapacity,
                ItemCollectionMetrics: result.ItemCollectionMetrics,
            };
        };
        /** Scan */
        this.scanRequest = (input) => {
            logger_1.default.info('DynamoDB scan input', input);
            return this.getDocumentClient().scan(input);
        };
        this.scan = async (input) => {
            // クエリ実行
            const results = await this.scanRequest(input).promise();
            logger_1.default.info(`DynamoDB scan success. LastEvaluatedKey: ${results.LastEvaluatedKey}`, results);
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
            logger_1.default.debug('DynamoDB scan results', results);
            return results;
        };
        /** Update */
        this.updateRequest = (input) => {
            logger_1.default.info('Dynamodb update item input', input);
            return this.getDocumentClient().update(input);
        };
        this.update = async (input) => {
            const result = await this.updateRequest(input).promise();
            logger_1.default.info('DynamoDB update success.');
            return result;
        };
        /** Delete */
        this.deleteRequest = (input) => {
            logger_1.default.info('Dynamodb delete item input', input);
            return this.getDocumentClient().delete(input);
        };
        this.delete = async (input) => {
            const result = await this.deleteRequest(input).promise();
            logger_1.default.info('DynamoDB delete success.');
            return result;
        };
        /** テーブル情報を取得する */
        this.tableSchema = async (tableName) => {
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
        this.batchDeleteRequest = async (tableName, records) => {
            // テーブル情報を取得する
            const keySchema = await this.tableSchema(tableName);
            const keys = keySchema.map((item) => item.AttributeName);
            const requests = [];
            const writeRequests = [];
            // リクエストを作成する
            for (let idx = 0; idx < records.length; idx = idx + 1) {
                const item = records[idx];
                const keyItem = {};
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
        this.batchPutRequest = (records) => {
            const requests = [];
            const writeRequests = [];
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
        this.process = async (tableName, requests) => {
            const tasks = requests.map((item, idx) => new Promise(async (resolve) => {
                logger_1.default.debug(`Queue${idx + 1}, in flight items: ${item.length}`);
                let unprocessed = {
                    [tableName]: item,
                };
                // tslint:disable-next-line: space-in-parens
                for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0;) {
                    const results = await this.getDocumentClient()
                        .batchWrite({
                        RequestItems: unprocessed,
                    })
                        .promise();
                    // 処理対象がない
                    if (!results.UnprocessedItems) {
                        logger_1.default.debug(`Queue${idx + 1}, process complete.`);
                        break;
                    }
                    unprocessed = results.UnprocessedItems;
                }
                resolve();
            }));
            // delete all
            await Promise.all(tasks);
        };
        /**
         * 一括削除（全件削除）
         */
        this.truncateAll = async (tableName) => {
            const values = await this.scan({
                TableName: tableName,
            });
            // データが存在しない
            if (!values.Items)
                return;
            return await this.truncate(tableName, values.Items);
        };
        /**
         * 一括削除（一部削除）
         */
        this.truncate = async (tableName, records) => {
            logger_1.default.info(`DynamoDB truncate start... ${tableName}`);
            // リクエスト作成
            const requests = await this.batchDeleteRequest(tableName, records);
            // キューでリクエスト実行
            await this.process(tableName, requests);
            logger_1.default.info(`DynamoDB truncate finished... ${tableName}`);
        };
        /**
         * 一括登録
         */
        this.bulk = async (tableName, records) => {
            logger_1.default.info(`DynamoDB bulk insert start... ${tableName}`);
            logger_1.default.debug(`DynamoDB bulk insert records`, records);
            // リクエスト作成
            const requests = this.batchPutRequest(records);
            // キューでリクエスト実行
            await this.process(tableName, requests);
            logger_1.default.info(`DynamoDB bulk insert finished... ${tableName}`);
        };
        if (configs) {
            this.configs.update(configs);
        }
    }
}
exports.DynamodbHelper = DynamodbHelper;
