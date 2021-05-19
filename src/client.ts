import { DynamoDB } from 'aws-sdk';

export type DocumentClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;
export type ClientOptions = DynamoDB.ClientConfiguration;

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

  return client;
};
