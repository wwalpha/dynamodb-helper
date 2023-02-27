# DynamoDB Helper

## Installation

```
yarn add @alphax/dynamodb
or
npm i @alphax/dynamodb
```

## Feature

- Bulk Insert and Trancate
- Easy implement for database query
- Query Logging with log4js
- Option to tracing with AWS X-Ray
- CLI commands

## Usage

```js
import { DynamodbHelper } from '@alphax/dynamodb';

const helper = new DynamodbHelper({
  logger: {
    appenders: { console: { type: 'console' } },
    categories: { default: { appenders: ['console'], level: 'info' } },
  },
  options: {
    endpoint: 'http://localhost:8001',
    region: 'ap-northeast-1',
  },
});

(async () => {
  const tableName = 'TableName';

  // scan
  const results = await helper.scan({
    TableName: tableName,
  });

  // truncateAll
  await helper.truncateAll(tableName);

  // if exists
  if (results.Items) {
    // bulk insert
    await helper.bulk(tableName, results.Items);
  }
})();
```

## Methods

| Name          | Description                  |
| ------------- | ---------------------------- |
| scan          | Scan items promise           |
| scanRequest   | Scan item request            |
| query         | Query item promise           |
| queryRequest  | Query item request           |
| get           | Get item promise             |
| getRequest    | Get item request             |
| put           | Put item promise             |
| putRequest    | Put item request             |
| update        | Update item promise          |
| updateRequest | Update item request          |
| delete        | Delete item promise          |
| deleteRequest | Delete item request          |
| truncateAll   | truncate all records         |
| truncate      | truncate records with inputs |
| bulk          | Insert all records           |
