import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from 'node:http';

/**
 * table data item client
 */
export const documentClient = (
  options: DynamoDBClientConfig = {
    region: process.env.AWS_DEFAULT_REGION as string,
  }
): DynamoDBDocument => {
  const dbClient = client(options);

  return DynamoDBDocument.from(dbClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

/**
 * table client
 *
 * @param options
 */
export const client = (
  options: DynamoDBClientConfig = {
    region: process.env.AWS_DEFAULT_REGION as string,
    requestHandler: new NodeHttpHandler({
      httpAgent: new Agent({ keepAlive: false }),
    }),
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

  return new DynamoDB(options);
};
