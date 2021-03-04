import { DynamodbHelper } from '../src';
import AWSXRay from 'aws-xray-sdk-core';

(async () => {
  const helper = new DynamodbHelper({
    options: {
      xray: false,
      region: 'ap-northeast-1',
      endpoint: 'http://localhost:6666',
    },
  });

  console.log(helper.getDocumentClient());

  // const tableName = 'AutoNotification_History';

  // const results = await helper.scan({
  //   TableName: tableName,
  // });

  // console.log(results.Count);

  // console.log(results);
  // await helper.get({
  //   TableName: tableName,
  //   Key: {
  //     userId: 'user001',
  //     groupId: 'group001',
  //   },
  // });

  // await helper.query({
  //   TableName: tableName,
  //   KeyConditionExpression: '#userId = :userId',
  //   ExpressionAttributeNames: {
  //     '#userId': 'userId',
  //   },
  //   ExpressionAttributeValues: {
  //     ':userId': 'user001',
  //   },
  // });

  // await helper.update({
  //   TableName: tableName,
  //   Key: {
  //     userId: 'user001',
  //     groupId: 'group001',
  //   },
  // });

  // await helper.truncateAll(tableName);

  // if (results.Items) {
  //   await helper.bulk(tableName, results.Items);
  // }
})();
