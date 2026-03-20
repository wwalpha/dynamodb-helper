import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const resolveCredentials = (options: DynamoDBClientConfig): DynamoDBClientConfig['credentials'] | undefined => {
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

const resolveOptions = (options: DynamoDBClientConfig = {}): DynamoDBClientConfig => {
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
export const documentClient = (
  options: DynamoDBClientConfig = {
    region: process.env.AWS_DEFAULT_REGION as string,
  },
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
  },
): DynamoDBClient => {
  return new DynamoDBClient(resolveOptions(options));
};
