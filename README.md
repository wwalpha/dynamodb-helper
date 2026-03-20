# DynamoDB Helper

## Installation

```bash
yarn add @alphax/dynamodb
# or
npm i @alphax/dynamodb
```

## Version Policy

This package keeps AWS SDK dependencies on the `3.650.0` line instead of `latest`.

- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/util-dynamodb`

The reason is runtime stability in CommonJS and Jest node environments. Newer Smithy builds introduce dynamic `import()` paths in credential and defaults resolution, which can fail under the standard `ts-jest` + `testEnvironment: 'node'` execution model. The `3.650.0` line avoids that behavior while keeping the helper compatible with DynamoDB Local, LocalStack, and AWS.

`lodash` and `winston` are also pinned to semver ranges instead of `latest` to avoid accidental runtime drift.

## Client Defaults

The helper now applies these defaults when you create a client:

- `defaultsMode: 'standard'`
- credentials from `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` when present
- local placeholder credentials when `endpoint` is set and explicit credentials are not provided

That keeps local tests working in Jest without requiring `NODE_OPTIONS=--experimental-vm-modules`.

## Usage

```ts
import { DynamodbHelper } from '@alphax/dynamodb';

const helper = new DynamodbHelper({
  options: {
    endpoint: 'http://localhost:8000',
    region: 'ap-northeast-1',
  },
});

const tableName = 'TableName';

const page = await helper.scanPage({
  TableName: tableName,
  Limit: 25,
});

const allItems = await helper.scanAll({
  TableName: tableName,
});

await helper.truncateAll(tableName);

if (allItems.Items.length > 0) {
  await helper.bulk(tableName, allItems.Items);
}
```

## Methods

| Name                 | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `scanPage`           | Returns a single DynamoDB `Scan` page                             |
| `scanAll`            | Returns all `Scan` pages                                          |
| `scan`               | Alias of `scanAll`                                                |
| `queryPage`          | Returns a single DynamoDB `Query` page                            |
| `queryAll`           | Returns all `Query` pages                                         |
| `query`              | Alias of `queryAll`                                               |
| `get`                | Reads one item                                                    |
| `put`                | Writes one item                                                   |
| `update`             | Updates one item                                                  |
| `delete`             | Deletes one item                                                  |
| `batchGet`           | Fetches items in 100-key chunks with retry for `UnprocessedKeys`  |
| `bulk`               | Writes items in 25-item chunks with retry for `UnprocessedItems`  |
| `truncate`           | Deletes records in 25-item chunks                                 |
| `truncateConcurrent` | Deletes multiple chunks in parallel with configurable concurrency |
| `truncateAll`        | Scans and deletes the whole table                                 |
| `transactWrite`      | Executes a DynamoDB transaction                                   |

## Pagination Semantics

The helper exposes explicit page and all-page APIs.

### `queryPage` and `scanPage`

- They execute exactly one DynamoDB request.
- `Limit` keeps the native DynamoDB meaning of page size / evaluated item limit.
- `LastEvaluatedKey` is returned when more data exists.
- `Count` and `ScannedCount` are the values from that single response.

### `queryAll` / `query` and `scanAll` / `scan`

- They follow `LastEvaluatedKey` until all pages are consumed.
- When `Limit` is set, it is treated as a total returned item limit for the aggregated result.
- `LastEvaluatedKey` is returned only when the helper stops early because that total limit was reached.
- `Count` is always aligned to the number of returned `Items`.
- `ScannedCount` is the sum of all scanned pages.

## Batch APIs

### `batchGet`

- Splits requests into 100-key chunks
- Retries `UnprocessedKeys`
- Throws a clear error when the retry budget is exhausted
- Returns typed items through `batchGet<T>()`

### `truncateConcurrent`

- Splits delete requests into 25-item chunks
- Runs multiple chunks in parallel
- Accepts either a numeric concurrency value or an options object
- Retries `UnprocessedItems`
- Throws a clear error when retries are exhausted

## Testing

The test suite uses Jest with `testEnvironment: 'node'` and DynamoDB Local in Docker.

```bash
npm test
```

It covers:

- CRUD
- query / scan page and all-page behavior
- bulk writes
- truncate and truncateConcurrent
- batchGet
- Jest node runtime compatibility
