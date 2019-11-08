import * as DynamoDBHelper from '../lib';

// const helper = new Helper({
//   logger: {
//     appenders: { console: { type: 'console' } },
//     categories: { default: { appenders: ['console'], level: 'info' } }
//   },
// options: {
//   endpoint: 'http://localhost:8001',
//   region: 'ap=northeast-1'
// }
// });

// DynamoDBHelper.config.update({
//   logger: {
//     appenders: { console: { type: 'console' } },
//     categories: { default: { appenders: ['console'], level: 'info' } },
//   },
// });

const helper = new DynamoDBHelper.Helper();

(async () => {
  const tableName = 'TableName';

  const results = await helper.scan({
    TableName: tableName
  });

  await helper.get({
    TableName: tableName,
    Key: {
      userId: 'user001',
      groupId: 'group001'
    }
  });

  await helper.query({
    TableName: tableName,
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId'
    },
    ExpressionAttributeValues: {
      ':userId': 'user001'
    }
  });

  await helper.update({
    TableName: tableName,
    Key: {
      userId: 'user001',
      groupId: 'group001'
    }
  });

  await helper.truncateAll(tableName);

  if (results.Items) {
    await helper.bulk(tableName, results.Items);
  }
})();
