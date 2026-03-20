import {
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';
import { DynamodbHelper } from '../src';

type TestItem = {
  groupId: string;
  order: number;
  payload: string;
  pk: string;
  sk: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const TABLE_NAME = 'DYNAMODB_HELPER_TEST';
const GROUP_INDEX_NAME = 'groupId-order-index';

const helper = new DynamodbHelper({
  options: {
    region: 'ap-northeast-1',
    endpoint: 'http://localhost:8000',
  },
});

const makeItem = (index: number): TestItem => ({
  pk: index < 70 ? 'USER#A' : 'USER#B',
  sk: `ITEM#${String(index).padStart(3, '0')}`,
  groupId: `GROUP#${index % 3}`,
  order: index,
  status: index % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
  payload: `payload-${index}`,
});

const sortItems = (items: TestItem[]) =>
  items.slice().sort((left, right) => `${left.pk}:${left.sk}`.localeCompare(`${right.pk}:${right.sk}`));

const waitForDynamo = async () => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await helper.getClient().send(new ListTablesCommand({}));
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
};

const createTable = async () => {
  await helper.getClient().send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
        { AttributeName: 'groupId', AttributeType: 'S' },
        { AttributeName: 'order', AttributeType: 'N' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: GROUP_INDEX_NAME,
          KeySchema: [
            { AttributeName: 'groupId', KeyType: 'HASH' },
            { AttributeName: 'order', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    }),
  );

  await waitUntilTableExists({ client: helper.getClient(), maxWaitTime: 30 }, { TableName: TABLE_NAME });
};

const deleteTable = async () => {
  try {
    await helper.getClient().send(new DeleteTableCommand({ TableName: TABLE_NAME }));
    await waitUntilTableNotExists({ client: helper.getClient(), maxWaitTime: 30 }, { TableName: TABLE_NAME });
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) {
      throw error;
    }
  }
};

describe('DynamodbHelper', () => {
  beforeAll(async () => {
    await waitForDynamo();
    await deleteTable();
    await createTable();
  });

  beforeEach(async () => {
    await helper.truncateAll(TABLE_NAME);
  });

  afterAll(async () => {
    await deleteTable();
    helper.getClient().destroy();
  });

  it('supports CRUD operations in a Jest node environment without explicit credentials', async () => {
    const item: TestItem = {
      pk: 'USER#CRUD',
      sk: 'ITEM#CRUD',
      groupId: 'GROUP#CRUD',
      order: 999,
      status: 'ACTIVE',
      payload: 'created',
    };

    await helper.put({
      TableName: TABLE_NAME,
      Item: item,
    });

    const created = await helper.get<TestItem>({
      TableName: TABLE_NAME,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
    });

    expect(created?.Item).toEqual(item);

    const updated = await helper.update<TestItem>({
      TableName: TABLE_NAME,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
      UpdateExpression: 'SET #payload = :payload',
      ExpressionAttributeNames: {
        '#payload': 'payload',
      },
      ExpressionAttributeValues: {
        ':payload': 'updated',
      },
      ReturnValues: 'ALL_NEW',
    });

    expect(updated.Attributes?.payload).toBe('updated');

    const deleted = await helper.delete<TestItem>({
      TableName: TABLE_NAME,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
      ReturnValues: 'ALL_OLD',
    });

    expect(deleted.Attributes?.pk).toBe(item.pk);

    const afterDelete = await helper.get<TestItem>({
      TableName: TABLE_NAME,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
    });

    expect(afterDelete).toBeUndefined();
  });

  it('distinguishes one-page and all-page query and scan APIs', async () => {
    const items = Array.from({ length: 120 }, (_, index) => makeItem(index));

    await helper.bulk(TABLE_NAME, items);

    const queryPage = await helper.queryPage<TestItem>({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': 'USER#A',
      },
      Limit: 10,
    });

    expect(queryPage.Items).toHaveLength(10);
    expect(queryPage.Count).toBe(10);
    expect(queryPage.LastEvaluatedKey).toBeDefined();

    const queryAll = await helper.queryAll<TestItem>({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': 'USER#A',
      },
    });

    expect(queryAll.Items).toHaveLength(70);
    expect(queryAll.Count).toBe(70);
    expect(queryAll.LastEvaluatedKey).toBeUndefined();

    const filteredQuery = await helper.query<TestItem>({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#pk = :pk',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':pk': 'USER#A',
        ':status': 'ACTIVE',
      },
      Limit: 12,
    });

    expect(filteredQuery.Items).toHaveLength(12);
    expect(filteredQuery.Count).toBe(12);
    expect(filteredQuery.LastEvaluatedKey).toBeDefined();

    const gsiQuery = await helper.queryAll<TestItem>({
      TableName: TABLE_NAME,
      IndexName: GROUP_INDEX_NAME,
      KeyConditionExpression: '#groupId = :groupId AND #order BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#groupId': 'groupId',
        '#order': 'order',
      },
      ExpressionAttributeValues: {
        ':groupId': 'GROUP#1',
        ':start': 1,
        ':end': 100,
      },
    });

    expect(gsiQuery.Items.length).toBeGreaterThan(0);
    expect(gsiQuery.Items.every((item) => item.groupId === 'GROUP#1')).toBe(true);

    const scanPage = await helper.scanPage<TestItem>({
      TableName: TABLE_NAME,
      Limit: 15,
    });

    expect(scanPage.Items).toHaveLength(15);
    expect(scanPage.Count).toBe(15);
    expect(scanPage.LastEvaluatedKey).toBeDefined();

    const filteredScan = await helper.scan<TestItem>({
      TableName: TABLE_NAME,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'ACTIVE',
      },
      Limit: 18,
    });

    expect(filteredScan.Items).toHaveLength(18);
    expect(filteredScan.Count).toBe(18);
    expect(filteredScan.LastEvaluatedKey).toBeDefined();

    const scanAll = await helper.scanAll<TestItem>({
      TableName: TABLE_NAME,
    });

    expect(scanAll.Items).toHaveLength(120);
    expect(scanAll.Count).toBe(120);
    expect(scanAll.LastEvaluatedKey).toBeUndefined();
  });

  it('supports batchGet, bulk, truncateConcurrent, and truncateAll', async () => {
    const items = Array.from({ length: 110 }, (_, index) => makeItem(index));

    await helper.bulk(TABLE_NAME, items);

    const batchItems = await helper.batchGet<TestItem>(
      TABLE_NAME,
      items.map((item) => ({ pk: item.pk, sk: item.sk })),
    );

    expect(sortItems(batchItems)).toEqual(sortItems(items));

    await helper.truncateConcurrent(TABLE_NAME, items.slice(0, 60), 4);

    const afterConcurrentTruncate = await helper.scanAll<TestItem>({
      TableName: TABLE_NAME,
    });

    expect(afterConcurrentTruncate.Items).toHaveLength(50);

    await helper.truncateAll(TABLE_NAME);

    const afterTruncateAll = await helper.scanAll<TestItem>({
      TableName: TABLE_NAME,
    });

    expect(afterTruncateAll.Items).toHaveLength(0);
  });
});
