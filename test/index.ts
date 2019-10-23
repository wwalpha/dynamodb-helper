import * as DynamoDBHelper from '../lib';

// const helper = new Helper({
//   logger: {
//     appenders: { console: { type: 'console' } },
//     categories: { default: { appenders: ['console'], level: 'info' } },
//   },
// });
console.log(DynamoDBHelper);

// DynamoDBHelper.config.update({
//   logger: {
//     appenders: { console: { type: 'console' } },
//     categories: { default: { appenders: ['console'], level: 'info' } },
//   },
// });

const helper = new DynamoDBHelper.Helper();

(async () => {
  const results = await helper.scan({
    TableName: 'PocketCards_UserGroups',
  });

  await helper.get({
    TableName: 'PocketCards_UserGroups',
    Key: {
      userId: 'wwalpha',
      groupId: 'x001',
    },
  });

  await helper.query({
    TableName: 'PocketCards_UserGroups',
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId',
    },
    ExpressionAttributeValues: {
      ':userId': 'wwalpha',
    },
  });

  await helper.update({
    TableName: 'PocketCards_UserGroups',
    Key: {
      userId: 'wwalpha',
      groupId: 'x001',
    },
  });

  await helper.truncateAll('PocketCards_UserGroups');

  if (results.Items) {
    await helper.bulk('PocketCards_UserGroups', results.Items);
  }
})();
