import { CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamodbHelper } from '../src';

const helper = new DynamodbHelper({
  options: {
    region: 'ap-northeast-1',
    endpoint: 'http://localhost:4566',
  },
});

const TABLE_NAME = 'DYNAMODB_HELPER_TEST';

const start = async () => {
  await createTable();

  await putItem('user001', 'group001');
  await putItem('user001', 'group002');
  await putItem('user002', 'group001');
  await putItem('user002', 'group002');

  const scanResults = await scan();

  console.log('Scan Results Count', scanResults.Count);
  console.log(scanResults);

  await getItem('user001', 'group001');

  const queryResults = await query('user002');
  console.log('Query Results Count', queryResults.Count);
  console.log(queryResults);

  await update('user001', 'group001');

  await helper.truncateAll(TABLE_NAME);

  if (scanResults.Items) {
    await helper.bulk(TABLE_NAME, scanResults.Items);
  }

  await dropTable();
};

const createTable = async () =>
  await helper.getClient().send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      BillingMode: 'PROVISIONED',
      KeySchema: [
        {
          KeyType: 'HASH',
          AttributeName: 'userId',
        },
        {
          KeyType: 'RANGE',
          AttributeName: 'groupId',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'userId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'groupId',
          AttributeType: 'S',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
      },
    })
  );

const dropTable = async () => await helper.getClient().send(new DeleteTableCommand({ TableName: TABLE_NAME }));

const putItem = async (userId: string, groupId: string) =>
  await helper.put({
    TableName: TABLE_NAME,
    Item: {
      userId: userId,
      groupId: groupId,
      status: '1',
    },
  });

const getItem = async (userId: string, groupId: string) =>
  await helper.get({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      groupId: groupId,
    },
  });

const scan = async () =>
  await helper.scan({
    TableName: TABLE_NAME,
  });

const query = async (userId: string) =>
  await helper.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId',
    },
    ExpressionAttributeValues: {
      ':userId': 'userId',
    },
  });

const update = async (userId: string, groupId: string) =>
  await helper.update({
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      groupId: groupId,
    },
  });

start();
