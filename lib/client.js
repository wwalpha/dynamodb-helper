"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var AWS = __importStar(require("aws-sdk"));
exports.client = function (configs) {
    if (!configs) {
        return new AWS.DynamoDB.DocumentClient();
    }
    return new AWS.DynamoDB.DocumentClient(configs.options);
    // if (configs.xray) {
    //   // const DocumentClient = XRay.captureAWSClient<AWS.DynamoDB.DocumentClient>(require('aws-sdk'));
    //   // return new DocumentClient();
    // }
};
