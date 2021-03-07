"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.documentClient = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_xray_sdk_core_1 = __importDefault(require("aws-xray-sdk-core"));
aws_xray_sdk_core_1.default.enableAutomaticMode();
aws_xray_sdk_core_1.default.setContextMissingStrategy('LOG_ERROR');
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
    if (options.xray === true) {
        const client = new aws_sdk_1.DynamoDB.DocumentClient({
            service: new aws_sdk_1.DynamoDB(options),
            ...options,
        });
        aws_xray_sdk_core_1.default.captureAWSClient(client.service);
        return client;
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
    if (options.xray === true) {
        return aws_xray_sdk_core_1.default.captureAWSClient(client);
    }
    return client;
};
exports.client = client;
