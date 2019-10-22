import * as AWS from 'aws-sdk';
import { Configurations } from './helper';
export declare const client: (configs?: Configurations | undefined) => AWS.DynamoDB.DocumentClient;
