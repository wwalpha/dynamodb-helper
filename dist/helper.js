"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamodbHelper = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const omit_1 = __importDefault(require("lodash/omit"));
const client_1 = require("./client");
const configs_1 = require("./configs");
const logger_1 = __importDefault(require("./logger"));
const BATCH_GET_LIMIT = 100;
const BATCH_WRITE_LIMIT = 25;
const DEFAULT_BATCH_RETRIES = 5;
const DEFAULT_BULK_CONCURRENCY = 4;
const DEFAULT_TRUNCATE_CONCURRENCY = 4;
class DynamodbHelper {
    configs = new configs_1.Configs();
    docClient;
    client;
    constructor(configs) {
        if (configs) {
            this.configs.update(configs);
        }
    }
    getDocumentClient = () => {
        if (!this.docClient) {
            this.docClient = (0, client_1.documentClient)(this.configs.getOptions());
        }
        return this.docClient;
    };
    getClient = () => {
        if (!this.client) {
            this.client = (0, client_1.client)(this.configs.getOptions());
        }
        return this.client;
    };
    stripMetadata = (result) => (0, omit_1.default)(result, ['$metadata']);
    splitIntoChunks = (items, size) => {
        const chunks = [];
        for (let index = 0; index < items.length; index += size) {
            chunks.push(items.slice(index, index + size));
        }
        return chunks;
    };
    collectAllPages = async (input, requestPage) => {
        const items = [];
        const totalLimit = input.Limit;
        let accumulatedScannedCount = 0;
        let lastPage;
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
            };
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
            ...this.stripMetadata(lastPage ?? {}),
            Count: items.length,
            Items: items,
            LastEvaluatedKey: nextStartKey,
            ...(lastPage && lastPage.ScannedCount !== undefined ? { ScannedCount: accumulatedScannedCount } : {}),
        };
    };
    processWriteBatch = async (tableName, writeRequests, maxRetries) => {
        let pendingItems = writeRequests;
        for (let attempt = 0; pendingItems.length > 0; attempt += 1) {
            const result = await this.getDocumentClient().send(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [tableName]: pendingItems,
                },
            }));
            pendingItems = result.UnprocessedItems?.[tableName] ?? [];
            if (pendingItems.length === 0) {
                return;
            }
            if (attempt >= maxRetries) {
                throw new Error(`BatchWrite exceeded retry limit for ${tableName}. UnprocessedItems=${pendingItems.length}`);
            }
        }
    };
    processWriteRequests = async (tableName, requests, concurrency, maxRetries) => {
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
    getRequest = (input) => {
        logger_1.default.debug('dynamodb get item start...', input);
        return this.getDocumentClient().send(new lib_dynamodb_1.GetCommand(input));
    };
    get = async (input) => {
        try {
            const result = await this.getRequest(input);
            if (!result.Item) {
                return;
            }
            logger_1.default.debug('dynamodb get item success.', input);
            return {
                ...this.stripMetadata(result),
                Item: result.Item,
            };
        }
        catch (err) {
            logger_1.default.error('dynamodb get item error.', err.message, input, err);
            throw err;
        }
    };
    putRequest = (input) => {
        logger_1.default.debug('dynamodb put item start...', input);
        return this.getDocumentClient().send(new lib_dynamodb_1.PutCommand(input));
    };
    put = async (input) => {
        try {
            const result = await this.putRequest(input);
            logger_1.default.debug('dynamodb put item success.', input);
            return {
                ...this.stripMetadata(result),
                Attributes: result.Attributes,
            };
        }
        catch (err) {
            logger_1.default.error('dynamodb put item error.', err.message, input, err);
            throw err;
        }
    };
    queryRequest = async (input) => {
        logger_1.default.debug('dynamodb query page start...', JSON.stringify(input));
        const result = await this.getDocumentClient().send(new lib_dynamodb_1.QueryCommand(input));
        return {
            ...this.stripMetadata(result),
            Items: (result.Items ?? []),
        };
    };
    queryPage = async (input) => {
        try {
            const result = await this.queryRequest(input);
            logger_1.default.info('dynamodb query page success.', `Count=${result.Count ?? result.Items.length}`, input);
            return result;
        }
        catch (err) {
            logger_1.default.error('dynamodb query page error.', err.message, input, err);
            throw err;
        }
    };
    queryAll = async (input) => {
        try {
            const result = await this.collectAllPages(input, (pageInput) => this.queryRequest(pageInput));
            logger_1.default.info('dynamodb query success.', `Count=${result.Count}`, input);
            return result;
        }
        catch (err) {
            logger_1.default.error('dynamodb query error.', err.message, input, err);
            throw err;
        }
    };
    query = async (input) => this.queryAll(input);
    transactWrite = async (input) => {
        try {
            logger_1.default.debug('dynamodb transactWrite start...', input);
            const result = await this.getDocumentClient().send(new lib_dynamodb_1.TransactWriteCommand(input));
            logger_1.default.debug('dynamodb transactWrite success', input);
            return result;
        }
        catch (err) {
            logger_1.default.error('dynamodb transactWrite error.', err.message, input, err);
            throw err;
        }
    };
    scanRequest = async (input) => {
        logger_1.default.debug('dynamodb scan page start...', input);
        const result = await this.getDocumentClient().send(new lib_dynamodb_1.ScanCommand(input));
        return {
            ...this.stripMetadata(result),
            Items: (result.Items ?? []),
        };
    };
    scanPage = async (input) => {
        try {
            const result = await this.scanRequest(input);
            logger_1.default.info('dynamodb scan page success.', `Count=${result.Count ?? result.Items.length}`, input);
            return result;
        }
        catch (err) {
            logger_1.default.error('dynamodb scan page error.', err.message, input, err);
            throw err;
        }
    };
    scanAll = async (input) => {
        try {
            const result = await this.collectAllPages(input, (pageInput) => this.scanRequest(pageInput));
            logger_1.default.info('dynamodb scan success.', `Count=${result.Count}`, input);
            return result;
        }
        catch (err) {
            logger_1.default.error('dynamodb scan error.', err.message, input, err);
            throw err;
        }
    };
    scan = async (input) => this.scanAll(input);
    updateRequest = (input) => {
        logger_1.default.debug('dynamodb update start...', input);
        return this.getDocumentClient().send(new lib_dynamodb_1.UpdateCommand(input));
    };
    update = async (input) => {
        try {
            const result = await this.updateRequest(input);
            logger_1.default.debug('dynamodb update success...', input);
            return {
                ...this.stripMetadata(result),
                Attributes: result.Attributes,
            };
        }
        catch (err) {
            logger_1.default.error('dynamodb update error.', err.message, input, err);
            throw err;
        }
    };
    deleteRequest = (input) => {
        logger_1.default.debug('dynamodb delete item input', input);
        return this.getDocumentClient().send(new lib_dynamodb_1.DeleteCommand(input));
    };
    delete = async (input) => {
        try {
            logger_1.default.debug('dynamodb delete start...', {
                TABLE_NAME: input.TableName,
            });
            const result = await this.deleteRequest(input);
            logger_1.default.debug('dynamodb delete success...', {
                TABLE_NAME: input.TableName,
            });
            return {
                ...this.stripMetadata(result),
                Attributes: result.Attributes,
            };
        }
        catch (err) {
            logger_1.default.error('dynamodb delete error.', err.message, input, err);
            throw err;
        }
    };
    batchGet = async (tableName, keys, options = {}) => {
        const { maxRetries = DEFAULT_BATCH_RETRIES, ...requestOptions } = options;
        if (keys.length === 0) {
            return [];
        }
        const chunks = this.splitIntoChunks(keys, BATCH_GET_LIMIT);
        const items = [];
        for (const chunk of chunks) {
            let pendingKeys = chunk;
            for (let attempt = 0; pendingKeys.length > 0; attempt += 1) {
                const result = await this.getDocumentClient().send(new lib_dynamodb_1.BatchGetCommand({
                    ...requestOptions,
                    RequestItems: {
                        [tableName]: {
                            Keys: pendingKeys,
                        },
                    },
                }));
                items.push(...(result.Responses?.[tableName] ?? []));
                pendingKeys = (result.UnprocessedKeys?.[tableName]?.Keys ?? []);
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
    tableSchema = async (tableName) => {
        const table = await this.getClient().send(new client_dynamodb_1.DescribeTableCommand({ TableName: tableName }));
        if (!table.Table?.KeySchema) {
            throw new Error(`Table does not exist. ${tableName}`);
        }
        return table.Table.KeySchema;
    };
    batchDeleteRequest = async (tableName, records) => {
        const keySchema = await this.tableSchema(tableName);
        const keyNames = keySchema.map((item) => item.AttributeName).filter((item) => Boolean(item));
        const writeRequests = records.map((record) => {
            const key = keyNames.reduce((result, keyName) => {
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
    batchPutRequest = (records) => {
        const writeRequests = records.map((record) => ({
            PutRequest: {
                Item: record,
            },
        }));
        return this.splitIntoChunks(writeRequests, BATCH_WRITE_LIMIT);
    };
    truncateAll = async (tableName, lastEvaluatedKey) => {
        let nextStartKey = lastEvaluatedKey;
        do {
            const page = await this.scanPage({
                TableName: tableName,
                ExclusiveStartKey: nextStartKey,
            });
            if (page.Items.length > 0) {
                await this.truncate(tableName, page.Items);
            }
            nextStartKey = page.LastEvaluatedKey;
        } while (nextStartKey);
    };
    truncate = async (tableName, records) => {
        try {
            logger_1.default.debug('dynamodb truncate start...', {
                TABLE_NAME: tableName,
            });
            const requests = await this.batchDeleteRequest(tableName, records);
            await this.processWriteRequests(tableName, requests, 1, DEFAULT_BATCH_RETRIES);
            logger_1.default.debug('dynamodb truncate finished...', {
                TABLE_NAME: tableName,
            });
        }
        catch (err) {
            logger_1.default.error('dynamodb truncate error.', err.message, tableName, err);
            throw err;
        }
    };
    truncateConcurrent = async (tableName, records, options = {}) => {
        const resolvedOptions = typeof options === 'number' ? { concurrency: options } : options;
        const concurrency = resolvedOptions.concurrency ?? DEFAULT_TRUNCATE_CONCURRENCY;
        const maxRetries = resolvedOptions.maxRetries ?? DEFAULT_BATCH_RETRIES;
        try {
            logger_1.default.debug('dynamodb truncate concurrent start...', {
                TABLE_NAME: tableName,
                CONCURRENCY: concurrency,
            });
            const requests = await this.batchDeleteRequest(tableName, records);
            await this.processWriteRequests(tableName, requests, concurrency, maxRetries);
            logger_1.default.debug('dynamodb truncate concurrent finished...', {
                TABLE_NAME: tableName,
                CONCURRENCY: concurrency,
            });
        }
        catch (err) {
            logger_1.default.error('dynamodb truncate concurrent error.', err.message, tableName, err);
            throw err;
        }
    };
    bulk = async (tableName, records) => {
        try {
            logger_1.default.debug('dynamodb bulk insert start...', {
                TABLE_NAME: tableName,
            });
            const requests = this.batchPutRequest(records);
            await this.processWriteRequests(tableName, requests, DEFAULT_BULK_CONCURRENCY, DEFAULT_BATCH_RETRIES);
            logger_1.default.debug('dynamodb bulk insert success...', {
                TABLE_NAME: tableName,
            });
        }
        catch (err) {
            logger_1.default.error('dynamodb bulk insert error.', err.message, tableName, err);
            throw err;
        }
    };
}
exports.DynamodbHelper = DynamodbHelper;
