"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("./client");
var DynamodbHelper = /** @class */ (function () {
    function DynamodbHelper(configs) {
        if (configs === void 0) { configs = { xray: true }; }
        var _this = this;
        /**
         *
         */
        this.get = function (input) { return __awaiter(_this, void 0, void 0, function () {
            var ret, result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Dynamodb get item: ', input);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.client()
                                .get(input)
                                .promise()];
                    case 2:
                        result = _a.sent();
                        // データが存在しない
                        if (!result.Item)
                            return [2 /*return*/];
                        // 返却値設定
                        ret = {
                            ConsumedCapacity: result.ConsumedCapacity,
                            Item: result.Item,
                        };
                        return [2 /*return*/, ret];
                    case 3:
                        err_1 = _a.sent();
                        console.log(err_1);
                        return [2 /*return*/];
                    case 4:
                        console.log('Dynamodb get item result: ', ret);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.configs = configs;
    }
    return DynamodbHelper;
}());
exports.default = DynamodbHelper;
// import { DynamoDB } from 'aws-sdk';
// import { dynamoDB, dynamoDB2 } from './clientUtils';
// export const transactWrite = async (input: DynamoDB.DocumentClient.TransactWriteItemsInput): Promise<DynamoDB.DocumentClient.TransactWriteItemsOutput> => {
//   console.log('Dynamodb transactWrite: ', JSON.stringify(input));
//   const ret = await dynamoDB()
//     .transactWrite(input)
//     .promise();
//   return {
//     ConsumedCapacity: ret.ConsumedCapacity,
//     ItemCollectionMetrics: ret.ItemCollectionMetrics,
//   };
// };
// /** Query */
// const querySync = (input: DynamoDB.DocumentClient.QueryInput) => {
//   console.log(input);
//   return dynamoDB().query(input);
// };
// export const query = async (input: DynamoDB.DocumentClient.QueryInput) => {
//   // クエリ実行
//   const result = await querySync(input).promise();
//   // 検索結果出力
//   console.log(result);
//   // 上限ある場合、そのまま終了
//   if (input.Limit && input.Limit === result.Count) {
//     return result;
//   }
//   if (result.LastEvaluatedKey) {
//     const lastResult = await query({ ...input, ExclusiveStartKey: result.LastEvaluatedKey });
//     if (result.Items && lastResult.Items) {
//       result.Items = result.Items.concat(lastResult.Items);
//     }
//     if (result.Count && lastResult.Count) {
//       result.Count = result.Count + lastResult.Count;
//     }
//     if (result.ScannedCount && lastResult.ScannedCount) {
//       result.ScannedCount = result.ScannedCount + lastResult.ScannedCount;
//     }
//   }
//   // 上限ある場合、そのまま終了
//   if (input.Limit && input.Limit === result.Count) {
//     return result;
//   }
//   return result;
// };
// /** Scan */
// const scanSync = (input: DynamoDB.DocumentClient.ScanInput) => {
//   console.log(input);
//   return dynamoDB().scan(input);
// };
// export const scan = async (input: DynamoDB.DocumentClient.ScanInput) => {
//   // クエリ実行
//   const result = await scanSync(input).promise();
//   // 検索結果出力
//   console.log(result);
//   if (result.LastEvaluatedKey) {
//     const lastResult = await scan({ ...input, ExclusiveStartKey: result.LastEvaluatedKey });
//     if (result.Items && lastResult.Items) {
//       result.Items = result.Items.concat(lastResult.Items);
//     }
//     if (result.Count && lastResult.Count) {
//       result.Count = result.Count + lastResult.Count;
//     }
//     if (result.ScannedCount && lastResult.ScannedCount) {
//       result.ScannedCount = result.ScannedCount + lastResult.ScannedCount;
//     }
//   }
//   return result;
// };
// /** Update */
// const updateSync = (input: DynamoDB.DocumentClient.UpdateItemInput) => {
//   console.log(input);
//   return dynamoDB().update(input);
// };
// export const update = async (input: DynamoDB.DocumentClient.UpdateItemInput) => {
//   const result = await updateSync(input).promise();
//   console.log(result);
//   return result;
// };
// /** Delete */
// const deleteItemSync = (input: DynamoDB.DocumentClient.DeleteItemInput) => {
//   console.log(input);
//   return dynamoDB().delete(input);
// };
// export const deleteItem = async (input: DynamoDB.DocumentClient.DeleteItemInput) => {
//   const result = await deleteItemSync(input).promise();
//   console.log(result);
//   return result;
// };
// /** テーブル情報を取得する */
// const getTableSchema = async (tableName: string) => {
//   const table = await dynamoDB2()
//     .describeTable({
//       TableName: tableName,
//     })
//     .promise();
//   // 存在チェック
//   if (!table.Table || !table.Table.KeySchema) {
//     throw new Error('Table is not exists.');
//   }
//   return table.Table.KeySchema;
// };
// /** バッチ削除リクエストを作成 */
// const getDeleteRequest = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
//   // テーブル情報を取得する
//   const keySchema = await getTableSchema(tableName);
//   const keys = keySchema.map(item => item.AttributeName);
//   const requests: DynamoDB.DocumentClient.WriteRequests[] = [];
//   const writeRequests: DynamoDB.DocumentClient.WriteRequests = [];
//   // リクエストを作成する
//   for (let idx = 0; idx < records.length; idx = idx + 1) {
//     const item = records[idx];
//     const keyItem: { [key: string]: any } = {};
//     // Primary key
//     keys.forEach(key => {
//       keyItem[key] = item[key];
//     });
//     writeRequests.push({
//       DeleteRequest: {
//         Key: keyItem,
//       },
//     });
//     // 25件ごと、requestを作成する
//     if (writeRequests.length === 25) {
//       requests.push([...writeRequests]);
//       writeRequests.length = 0;
//     }
//   }
//   // 最後の件も追加する
//   requests.push([...writeRequests]);
//   return requests;
// };
// /** バッチ登録リクエストを作成 */
// const getPutRequest = async (records: DynamoDB.DocumentClient.AttributeMap[]) => {
//   const requests: DynamoDB.DocumentClient.WriteRequests[] = [];
//   const writeRequests: DynamoDB.DocumentClient.WriteRequests = [];
//   // リクエストを作成する
//   for (let idx = 0; idx < records.length; idx = idx + 1) {
//     const item = records[idx];
//     writeRequests.push({
//       PutRequest: {
//         Item: item,
//       },
//     });
//     // 25件ごと、requestを作成する
//     if (writeRequests.length === 25) {
//       requests.push([...writeRequests]);
//       writeRequests.length = 0;
//     }
//   }
//   // 最後の件も追加する
//   requests.push([...writeRequests]);
//   return requests;
// };
// /** バッチリクエストを実行する */
// const process = async (tableName: string, requests: DynamoDB.DocumentClient.WriteRequests[]) => {
//   const tasks = requests.map(
//     (item, idx) =>
//       new Promise(async resolve => {
//         console.log(`Queue${idx + 1}, in flight items: ${item.length}`);
//         let unprocessed: DynamoDB.DocumentClient.BatchWriteItemRequestMap = {
//           [tableName]: item,
//         };
//         // tslint:disable-next-line: space-in-parens
//         for (; Object.keys(unprocessed).length > 0 && unprocessed[tableName].length !== 0; ) {
//           const results = await dynamoDB()
//             .batchWrite({
//               RequestItems: unprocessed,
//             })
//             .promise();
//           // 処理対象がない
//           if (!results.UnprocessedItems) {
//             console.log(`Queue${idx + 1}, delete complete.`);
//             break;
//           }
//           unprocessed = results.UnprocessedItems;
//         }
//         resolve();
//       })
//   );
//   // delete all
//   await Promise.all(tasks);
// };
// export const truncateAll = async (tableName: string) => {
//   const values = await scan({
//     TableName: tableName,
//   });
//   // データが存在しない
//   if (!values.Items) return;
//   return await truncate(tableName, values.Items);
// };
// /** テーブルデータ一括削除 */
// export const truncate = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
//   console.log(`Truncate start... ${tableName}`);
//   // リクエスト作成
//   const requests = await getDeleteRequest(tableName, records);
//   // キューでリクエスト実行
//   await process(tableName, requests);
//   console.log(`Truncate end... ${tableName}`);
// };
// /** テーブルデータ一括登録 */
// export const bulk = async (tableName: string, records: DynamoDB.DocumentClient.AttributeMap[]) => {
//   console.log(`Bulk insert start... ${tableName}`);
//   console.log(records);
//   // リクエスト作成
//   const requests = await getPutRequest(records);
//   // キューでリクエスト実行
//   await process(tableName, requests);
//   console.log(`Bulk insert end... ${tableName}`);
// };
