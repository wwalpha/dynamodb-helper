"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.documentClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * table data item client
 */
const documentClient = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    const dbClient = (0, exports.client)(options);
    return lib_dynamodb_1.DynamoDBDocument.from(dbClient);
};
exports.documentClient = documentClient;
/**
 * table client
 *
 * @param options
 */
const client = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    // region attribute
    if (!options.region) {
        options.region = process.env.AWS_DEFAULT_REGION;
    }
    // endpoint
    if (!options.endpoint && process.env.AWS_ENDPOINT_URL) {
        options.endpoint = process.env.AWS_ENDPOINT_URL;
    }
    return new client_dynamodb_1.DynamoDB(options);
};
exports.client = client;
