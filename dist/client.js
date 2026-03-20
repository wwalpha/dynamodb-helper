"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.documentClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const resolveCredentials = (options) => {
    if (options.credentials) {
        return options.credentials;
    }
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
        };
    }
    if (options.endpoint) {
        return {
            accessKeyId: 'local',
            secretAccessKey: 'local',
        };
    }
    return undefined;
};
const resolveOptions = (options = {}) => {
    const region = options.region ?? process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION;
    const endpoint = options.endpoint ?? process.env.AWS_ENDPOINT_URL;
    return {
        ...options,
        region,
        endpoint,
        defaultsMode: options.defaultsMode ?? 'standard',
        credentials: resolveCredentials({ ...options, endpoint }),
    };
};
/**
 * table data item client
 */
const documentClient = (options = {
    region: process.env.AWS_DEFAULT_REGION,
}) => {
    const dbClient = (0, exports.client)(options);
    return lib_dynamodb_1.DynamoDBDocument.from(dbClient, {
        marshallOptions: {
            removeUndefinedValues: true,
        },
    });
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
    return new client_dynamodb_1.DynamoDBClient(resolveOptions(options));
};
exports.client = client;
