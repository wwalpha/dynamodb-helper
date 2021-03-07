import { DynamoDB } from 'aws-sdk';
import AWSXRay from 'aws-xray-sdk-core';

AWSXRay.enableAutomaticMode();
AWSXRay.setContextMissingStrategy('LOG_ERROR');

type XRayOptions = {
  xray?: boolean;
};

export type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions &
  DynamoDB.Types.ClientConfiguration &
  XRayOptions;
export type ClientOptions = DynamoDB.ClientConfiguration & XRayOptions;

/**
 * table data item client
 */
export const documentClient = (
  options: DocumentClientOptions = {
    region: process.env.AWS_DEFAULT_REGION as string,
  }
): DynamoDB.DocumentClient => {
  // region attribute
  if (!options.region) {
    options.region = process.env.AWS_DEFAULT_REGION;
  }

  // endpoint
  if (!options.endpoint && process.env.AWS_ENDPOINT_URL) {
    options.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  if (options.xray === true) {
    const client = new DynamoDB.DocumentClient({
      service: new DynamoDB(options),
      ...options,
    });

    AWSXRay.captureAWSClient((client as any).service);

    return client;
  }

  return new DynamoDB.DocumentClient(options);
};

/**
 * table client
 *
 * @param options
 */
export const client = (
  options: ClientOptions = {
    region: process.env.AWS_DEFAULT_REGION as string,
  }
): DynamoDB => {
  // region attribute
  if (!options.region) {
    options.region = process.env.AWS_DEFAULT_REGION;
  }

  // endpoint
  if (!options.endpoint && process.env.AWS_ENDPOINT_URL) {
    options.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  const client = new DynamoDB(options);

  if (options.xray === true) {
    return AWSXRay.captureAWSClient(client);
  }

  return client;
};
