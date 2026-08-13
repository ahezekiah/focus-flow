# Skill: Separate a Lambda Handler into Core Business + Repository (Ports and Adapters)

When asked to refactor a Lambda handler under `amplify/functions/`, apply the ports-and-adapters pattern: extract a pure domain service (the core) and a DynamoDB-backed repository (the adapter), connected by a plain TypeScript interface.

The goal is that the handler owns API Gateway concerns only (parsing the event, mapping results/errors to an `APIGatewayProxyResult`), the service owns business logic only, and the repository owns persistence only. None of the three layers knows about the internals of the others.

This skill sits under the rules in `.claude/rules/architecture.md` — REST over API Gateway + Lambda, DynamoDB read/written from Lambda handlers with the AWS SDK, zero GraphQL, zero AppSync, and errors carried on the HTTP status code (never `200` with an error body).

---

## Pattern overview

```
functions/<resource>/handler.ts          → API Gateway adapter (event/response, status codes, error mapping)
functions/_shared/<resource>Service.ts   → core business logic (validation, rules, orchestration)
functions/_shared/<resource>Repo.ts      → DynamoDB adapter (all persistence)
```

Repositories and services live in `amplify/functions/_shared/` (not per-function) because each Lambda bundles independently via esbuild — a relative import from `_shared/` is inlined into whichever function imports it, so sharing code this way costs nothing at runtime.

`_shared/` does not exist yet. The first refactor creates it along with the small helper modules the pattern relies on: `_shared/dynamo.ts` (document client + `tableName()`), `_shared/http.ts` (`json()`, `noContent()`, `preflight()`, `errorResponse()`, and the `ApiError` constructors), and `_shared/session.ts` (resolving the caller from the Cognito token). `amplify/functions/audio-files/handler.ts` is the natural first candidate — it currently holds routing, response shaping, validation, DynamoDB, and S3 presigning in one file.

The service receives a repository instance via constructor injection where the resource has enough surface to warrant it; trivial single-call resources are fine called directly from the handler — see the "when to skip the service layer" rule below.

---

## Step-by-step process

### 1. Read the target handler

Identify every DynamoDB call (`docs.send(...)`) and every S3 call. For each call, note:
- **What it returns** (the shape the service will consume)
- **What parameters it needs** (what the service will pass in)
- **Whether it has side-effects** (Put/Update/Delete)

### 2. Define the repository

- Table name comes from `tableName('SOME_TABLE_NAME')` (`_shared/dynamo.ts`), reading the env var wired up for that specific Lambda in `amplify/backend.ts` — never hardcode a table name.
- Every method maps to one (or a small, cohesive group of) DynamoDB operation — no business logic, no validation.
- Methods accept plain scalars and plain objects; they return plain record types (`interface FooRecord { ... }`).
- Name the file `amplify/functions/_shared/<resource>Repo.ts`.

```ts
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, tableName } from './dynamo';

const TABLE = () => tableName('AUDIO_FILE_TABLE');

export interface AudioFileRecord {
  id: string;
  name: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  status: 'uploading' | 'ready';
  addedAt: string;
}

export const audioFilesRepo = {
  async findAll(): Promise<AudioFileRecord[]> {
    // one ScanCommand/QueryCommand, no filtering/validation beyond what the query itself needs
  },
};
```

Presigned-URL generation is also an adapter concern — keep it in `_shared/audioStorage.ts` (S3 client + `presignUpload`/`presignPlay`), not in the service.

### 3. Write the service (when the resource has real business rules)

- Accept the repository as a factory/constructor argument (dependency injection) — never import a repository singleton directly into a service.
- Contains all business rules: validation, allowed content types, size limits, status transitions, domain decisions.
- Never touches the API Gateway event or an `APIGatewayProxyResult`.
- Throws `ApiError` (`_shared/http.ts` — `badRequest`, `notFound`, `conflict`, `unsupportedMediaType`, etc.) with business-meaningful messages; the handler's `errorResponse()` maps these to status codes.
- Name the file `amplify/functions/_shared/<resource>Service.ts`.

```ts
import { badRequest, unsupportedMediaType } from './http';
import { AudioFileRecord, audioFilesRepo } from './audioFilesRepo';

const ALLOWED_CONTENT_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];

export const audioFileService = {
  async create({ name, fileName, contentType }: { name?: string; fileName?: string; contentType?: string }): Promise<AudioFileRecord> {
    if (!name?.trim()) throw badRequest('A name is required');
    if (!ALLOWED_CONTENT_TYPES.includes(contentType!)) {
      throw unsupportedMediaType('That file type is not supported. Choose an mp3, wav, ogg or m4a file.');
    }
    return audioFilesRepo.create({ name: name.trim(), fileName: fileName!.trim(), contentType: contentType! });
  },
};
```

**When to skip the service layer**: if a resource is a single passthrough call with no validation or business rule (list-only), call the repository directly from the handler rather than adding a one-line service wrapper. Add the service layer the moment a second rule shows up.

### 4. Rewrite the handler

- Import the repository/service.
- Dispatch on `` `${event.httpMethod} ${event.resource}` `` — API Gateway supplies the matched resource template (`GET /audio-files/{audioFileId}`), so the handler never parses paths by hand.
- Each branch: parse input from the event, call the service/repository, return via `json()`/`noContent()` (`_shared/http.ts`).
- Error mapping: wrap the whole dispatch in one `try { ... } catch (err) { return errorResponse(err); }` — `errorResponse` reads `ApiError.status` when present, otherwise 500.

```ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errorResponse, json, preflight } from '../_shared/http';
import { audioFilesRepo } from '../_shared/audioFilesRepo';
import { audioFileService } from '../_shared/audioFileService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const id = event.pathParameters?.audioFileId;

  try {
    switch (`${event.httpMethod} ${event.resource}`) {
      case 'GET /audio-files':
        return json(200, { audioFiles: await audioFilesRepo.findAll() });
      case 'POST /audio-files':
        return json(201, await audioFileService.create(JSON.parse(event.body ?? '{}')));
      default:
        return json(404, { message: 'Unknown route' });
    }
  } catch (err) {
    return errorResponse(err);
  }
};
```

---

## Rules to follow strictly

1. **No DynamoDB or S3 SDK calls in handlers or services.** `ddb.send(...)` is used only inside `_shared/<resource>Repo.ts`; S3 clients only inside a `_shared/*Storage.ts` adapter.
2. **No API Gateway concepts in services.** A service method must not reference `event`, `APIGatewayProxyResult`, or status codes.
3. **No business logic in repositories.** A repository method is a thin DynamoDB call — one query/put/update, nothing more.
4. **Injection, not global state.** A service that needs a repository takes it as an argument; don't reach for a repository singleton from inside a service module.
5. **Errors carry intent.** Throw `ApiError` subtypes (`_shared/http.ts`) for expected failure cases (400, 404, 409, 413, 415); the handler's `errorResponse()` maps them. Unexpected failures bubble as 500. Never return `200` with an error body.
6. **Keep this codebase's file conventions.** TypeScript throughout in `amplify/`, ESM (`import`/`export`), one function per API Gateway resource mount, plural hyphenated lowercase paths.
7. **Table/bucket names always come from env vars** (`tableName('AUDIO_FILE_TABLE')`, `requiredEnv('AUDIO_BUCKET')`) wired per-function in `amplify/backend.ts` — a function should only have env vars for the tables it's actually granted access to.
8. **No GraphQL, no AppSync.** If a refactor appears to need either, stop and say so — see `.claude/rules/architecture.md` and `docs/decisions/Decision_Record.md`.

---

## Checklist before finishing

- [ ] `functions/<resource>/handler.ts` — no `ddb.send`/S3 calls, only dispatch + service/repository calls
- [ ] `functions/_shared/<resource>Service.ts` (if present) — no DynamoDB SDK, no API Gateway types; accepts repository via factory arg
- [ ] `functions/_shared/<resource>Repo.ts` — only DynamoDB SDK calls; no business rules
- [ ] All existing behaviour preserved (same HTTP verbs, same response shapes, same status codes)
- [ ] Error cases are reachable and return the correct status code via `ApiError`
- [ ] Any new table or bucket access is granted + wired (`grantReadData`/`grantReadWriteData` + `addEnvironment`) in `amplify/backend.ts`
