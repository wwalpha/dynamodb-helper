import { DynamoDB } from 'aws-sdk';
import XRay from 'aws-xray-sdk';

type XRayOption = {
  xray?: boolean;
};

export type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration & XRayOption;
export type ClientOptions = DynamoDB.ClientConfiguration & XRayOption;

/**
 *
 */
export const documentClient = (
  options: DocumentClientOptions = {
    region: process.env.AWS_DEFAULT_REGION as string,
  }
): DynamoDB.DocumentClient => {
  if (!options) return new DynamoDB.DocumentClient();

  let AWS = require('aws-sdk');

  if (options.xray === true) {
    AWS = XRay.captureAWS(AWS);
  }

  return new AWS.DynamoDB.DocumentClient(options);
};

export const client = (
  options: ClientOptions = {
    region: process.env.AWS_DEFAULT_REGION as string,
  }
): DynamoDB => {
  let AWS = require('aws-sdk');

  if (options.xray) {
    AWS = XRay.captureAWS(AWS);
  }

  return new AWS.DynamoDB(options);
};
