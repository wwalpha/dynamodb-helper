"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.documentClient = void 0;
const aws_sdk_1 = require("aws-sdk");
/**
 * table data item client
 */
const documentClient = (options = {
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
    return new aws_sdk_1.DynamoDB.DocumentClient(options);
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
    const client = new aws_sdk_1.DynamoDB(options);
    return client;
};
exports.client = client;
