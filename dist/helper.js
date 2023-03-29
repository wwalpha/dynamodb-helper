"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbHelper = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const omit_1 = __importDefault(require("lodash/omit"));
const client_1 = require("./client");
const logger_1 = __importDefault(require("./logger"));
const configs_1 = require("./configs");
class DynamodbHelper {
    constructor(configs) {
        /** client instance */
        this.configs = new configs_1.Configs();
        /** dynamodb client */
        this.getDocumentClient = () => {
            if (!this.docClient) {
                this.docClient = (0, client_1.documentClient)(this.configs.getOptions());
            }
            return this.docClient;
        };
        /** dynamodb client */
        this.getClient = () => {
            if (!this.client) {
                this.client = (0, client_1.client)(this.configs.getOptions());
            }
            return this.client;
        };
        /** Get */
        this.getRequest = (input) => {
            logger_1.default.debug('dynamodb get item start...', input);
            const command = new lib_dynamodb_1.GetCommand(input);
            return this.getDocumentClient().send(command);
        };
        /**
         *
         */
        this.get = async (input) => {
            try {
                const result = await this.getRequest(input);
                // データが存在しない
                if (!result.Item)
                    return;
                logger_1.default.debug('dynamodb get item success.', input);
                logger_1.default.debug('Dynamodb ConsumedCapacity: ', result.ConsumedCapacity);
                logger_1.default.debug('Dynamodb item: ', JSON.stringify(result.Item));
                return {
                    ...(0, omit_1.default)(result, ['$metadata']),
                    Item: result.Item,
                };
            }
            catch (err) {
                logger_1.default.error('dynamodb get item error.', err.message, input, err);
                throw err;
            }
        };
        /** Put */
        this.putRequest = (input) => {
            logger_1.default.debug('dynamodb put item start...', input);
            const command = new lib_dynamodb_1.PutCommand({
                ...input,
                Item: input.Item,
            });
            return this.getDocumentClient().send(command);
        };
        /** Put item */
        this.put = async (input) => {
            try {
                const result = await this.putRequest({ ...input, Item: input.Item });
                logger_1.default.debug('dynamodb put item success.', input);
                return {
                    Attributes: result.Attributes,
                };
            }
            catch (err) {
                logger_1.default.error('dynamodb put item error.', err.message, input, err);
                throw err;
            }
        };
        /** Query */
        this.queryRequest = async (input) => {
            logger_1.default.debug('dynamodb query start...', input);
            const command = new lib_dynamodb_1.QueryCommand(input);
            const results = await this.getDocumentClient().send(command);
            return {
                ...results,
                Items: results.Items,
            };
        };
        /** Query */
        this.query = async (input) => {
            var _a, _b;
            try {
                // クエリ実行
                const results = await this.queryRequest(input);
                // 上限ある場合、そのまま終了
                if (input.Limit && input.Limit === results.Count) {
                    logger_1.default.info('dynamodb query success.', `Count=${results.Count}`, input);
                    logger_1.default.debug('dynamodb query items.', results, results.Items);
                    return {
                        ...(0, omit_1.default)(results, ['$metadata']),
                        Items: ((_a = results.Items) !== null && _a !== void 0 ? _a : (results.Items = [])),
                    };
                }
                if (results.LastEvaluatedKey) {
                    const lastResult = await this.query({ ...input, ExclusiveStartKey: results.LastEvaluatedKey });
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
                logger_1.default.info('dynamodb query success.', `Count=${results.Count}`, input);
                logger_1.default.debug('dynamodb query items.', results, results.Items);
                // 上限ある場合、そのまま終了
                if (input.Limit && input.Limit === results.Count) {
                    return {
                        ...(0, omit_1.default)(results, ['$metadata']),
                        Items: ((_b = results.Items) !== null && _b !== void 0 ? _b : (results.Items = [])),
                    };
                }
                return {
                    ...(0, omit_1.default)(results, ['$metadata']),
                    Items: results.Items,
                };
            }
            catch (err) {
                logger_1.default.error('dynamodb query error.', err.message, input, err);
                throw err;
            }
        };
        this.transactWrite = async (input) => {
            try {
                logger_1.default.debug('dynamodb transactWrite start...', input);
                const command = new lib_dynamodb_1.TransactWriteCommand(input);
                const result = await this.getDocumentClient().send(command);
                logger_1.default.debug('dynamodb transactWrite success', input);
                return result;
            }
            catch (err) {
                logger_1.default.error('dynamodb transactWrite error.', err.message, input, err);
                throw err;
            }
        };
        /** Scan */
        this.scanRequest = async (input) => {
            logger_1.default.debug('dynamodb scan start...', input);
            const command = new lib_dynamodb_1.ScanCommand(input);
            const results = await this.getDocumentClient().send(command);
            return {
                ...results,
                Items: results.Items,
            };
        };
        this.scan = async (input) => {
            var _a;
            try {
                // クエリ実行
                const results = await this.scanRequest(input);
                logger_1.default.info('dynamodb scan success.', `Count=${results.Count}`, input);
                logger_1.default.debug('dynamodb scan results', results);
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
                logger_1.default.debug('dynamodb scan results', results);
                return {
                    ...(0, omit_1.default)(results, ['$metadata']),
                    Items: ((_a = results.Items) !== null && _a !== void 0 ? _a : (results.Items = [])),
                };
            }
            catch (err) {
                logger_1.default.error('dynamodb scan error.', err.message, input, err);
                throw err;
            }
        };
        /** Update */
        this.updateRequest = (input) => {
            logger_1.default.debug('dynamodb update start...', input);
            const command = new lib_dynamodb_1.UpdateCommand(input);
            return this.getDocumentClient().send(command);
        };
        this.update = async (input) => {
            try {
                const result = await this.updateRequest(input);
                logger_1.default.debug('dynamodb update success...', input);
                return result;
            }
            catch (err) {
                logger_1.default.error('dynamodb update error.', err.message, input, err);
                throw err;
            }
        };
        /** Delete */
        this.deleteRequest = (input) => {
            logger_1.default.debug('dynamodb delete item input', input);
            const command = new lib_dynamodb_1.DeleteCommand(input);
            return this.getDocumentClient().send(command);
        };
        this.delete = async (input) => {
            try {
                logger_1.default.debug('dynamodb delete start...', {
                    TABLE_NAME: input.TableName,
                });
                const result = await this.deleteRequest(input);
                logger_1.default.debug('dynamodb delete success...', {
                    TABLE_NAME: input.TableName,
                });
                return {
                    ...(0, omit_1.default)(result, ['$metadata']),
                    Attributes: result.Attributes,
                };
            }
            catch (err) {
                logger_1.default.error('dynamodb delete error.', err.message, input, err);
                throw err;
            }
        };
        /** テーブル情報を取得する */
        this.tableSchema = async (tableName) => {
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
            if (records.length === 0)
                return [];
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
            if (requests.length === 0)
                return;
            const tasks = requests.map((item, idx) => new Promise(async (resolve) => {
                logger_1.default.debug(`Queue${idx + 1}, in flight items: ${item.length}`);
                let unprocessed = {
                    [tableName]: item,
                };
                for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0;) {
                    const command = new lib_dynamodb_1.BatchWriteCommand({
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
            try {
                logger_1.default.debug('dynamodb truncate start...', {
                    TABLE_NAME: tableName,
                });
                // リクエスト作成
                const requests = await this.batchDeleteRequest(tableName, records);
                // キューでリクエスト実行
                await this.process(tableName, requests);
                logger_1.default.debug('dynamodb truncate finished...', {
                    TABLE_NAME: tableName,
                });
            }
            catch (err) {
                logger_1.default.error('dynamodb truncate error.', err.message, tableName, err);
                throw err;
            }
        };
        /**
         * 一括登録
         */
        this.bulk = async (tableName, records) => {
            try {
                logger_1.default.debug('dynamodb bulk insert start...', {
                    TABLE_NAME: tableName,
                });
                // リクエスト作成
                const requests = this.batchPutRequest(records);
                // キューでリクエスト実行
                await this.process(tableName, requests);
                logger_1.default.debug('dynamodb bulk insert finished...', {
                    TABLE_NAME: tableName,
                });
            }
            catch (err) {
                logger_1.default.error('dynamodb truncate error.', err.message, tableName, err);
                throw err;
            }
        };
        if (configs) {
            this.configs.update(configs);
        }
    }
}
exports.DynamodbHelper = DynamodbHelper;
