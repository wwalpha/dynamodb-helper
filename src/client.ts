import * as AWS from 'aws-sdk';
import { Configurations } from './helper';

export const client = (configs?: Configurations) => {
  if (!configs) {
    return new AWS.DynamoDB.DocumentClient();
  }
  return new AWS.DynamoDB.DocumentClient(configs.options);

  // if (configs.xray) {
  //   // const DocumentClient = XRay.captureAWSClient<AWS.DynamoDB.DocumentClient>(require('aws-sdk'));
  //   // return new DocumentClient();
  // }
};
