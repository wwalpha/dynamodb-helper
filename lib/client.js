"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const aws_xray_sdk_1 = __importDefault(require("aws-xray-sdk"));
/**
 *
 */
exports.documentClient = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    if (!options)
        return new aws_sdk_1.DynamoDB.DocumentClient();
    let AWS = require('aws-sdk');
    if (options.xray === true) {
        AWS = aws_xray_sdk_1.default.captureAWS(AWS);
    }
    return new AWS.DynamoDB.DocumentClient(options);
};
exports.client = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    let AWS = require('aws-sdk');
    if (options.xray) {
        AWS = aws_xray_sdk_1.default.captureAWS(AWS);
    }
    return new AWS.DynamoDB(options);
};
