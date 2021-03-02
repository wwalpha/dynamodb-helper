"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.documentClient = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_xray_sdk_core_1 = __importDefault(require("aws-xray-sdk-core"));
aws_xray_sdk_core_1.default.config([aws_xray_sdk_core_1.default.plugins.EC2Plugin]);
aws_xray_sdk_core_1.default.setContextMissingStrategy('LOG_ERROR');
/**
 * table data item client
 */
const documentClient = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    console.log('xray', options.xray);
    // if (options.xray === true) {
    //   AWSXRay.enableAutomaticMode();
    // } else {
    //   AWSXRay.enableManualMode();
    // }
    const AWS = aws_xray_sdk_core_1.default.captureAWS(require('aws-sdk'));
    aws_xray_sdk_core_1.default.setContextMissingStrategy('LOG_ERROR');
    const client = new AWS.DynamoDB.DocumentClient(options);
    return client;
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
    if (options.xray === true) {
        aws_xray_sdk_core_1.default.enableAutomaticMode();
    }
    else {
        aws_xray_sdk_core_1.default.enableManualMode();
    }
    return new aws_sdk_1.DynamoDB(options);
};
exports.client = client;
