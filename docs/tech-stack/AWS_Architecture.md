# Focus Flow AWS Architecture

Focus Flow is deployed on **AWS Amplify**. The client-facing API style is **REST**, not GraphQL.
This document is the reference for how the pieces fit together and which service owns what.

---

## Service Map

| Concern | Service | Notes |
|---|---|---|
| Frontend hosting | **AWS Amplify Hosting** | Builds the Vite/React app from Git and serves it from CloudFront. |
| Backend definition | **Amplify Gen 2** (`amplify/` folder, TypeScript) | Backend is defined in code and deployed per branch. |
| REST API | **API Gateway (REST) + Lambda** | The primary, client-facing contract. All frontend calls go here. |
| Auth | **Amazon Cognito** (`defineAuth`) | Issues the tokens API Gateway authorizes against. |
| Data | **Amazon DynamoDB** | Read and written by Lambda handlers using the AWS SDK. |
| File storage | **Amazon S3** (`defineStorage`) | Audio files, theme images, playlist artwork. |
| Functions | **AWS Lambda** (`defineFunction`) | One handler per REST resource. |

---

## Request Flow

```text
Browser (React SPA on Amplify Hosting)
        |
        |  HTTPS + Cognito JWT
        v
API Gateway (REST)  ->  Lambda handler
                            |
                            +--> DynamoDB   (application data)
                            +--> S3         (audio + images)
```

The frontend only ever talks to REST endpoints. There is no GraphQL anywhere in the
stack — nothing in `src/` holds a GraphQL document, and no service exposes one.

---

## No GraphQL

REST is the only API style in this project. AppSync was considered and rejected: it is a
GraphQL service with no REST mode, so adopting it would reverse the REST decision.

DynamoDB tables are provisioned through Amplify Gen 2 and read and written from Lambda
handlers with the AWS SDK. If real-time features — live accountability activity, live session
status — are built later, they use WebSockets on API Gateway rather than GraphQL subscriptions.

---

## REST Endpoints

Resource-per-endpoint, standard HTTP verbs:

```text
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/{taskId}
DELETE /api/tasks/{taskId}

GET    /api/sessions
POST   /api/sessions
PATCH  /api/sessions/{sessionId}/complete

GET    /api/users/{userId}/streak
GET    /api/themes
GET    /api/playlists
GET    /api/audio-files
POST   /api/audio-files
GET    /api/audio-files/{audioFileId}
PATCH  /api/audio-files/{audioFileId}
```

Conventions:

- Plural, lowercase, hyphenated resource names.
- Path parameters in braces; filtering and paging via query string.
- `2xx` on success, `4xx` for client errors, `5xx` for server errors — errors are
  carried by the status code, not by a `200` with an error body.
- Every endpoint except public reference data (themes, default playlists) requires a
  Cognito token.

---

## Audio File Storage

Audio uploads go to S3, not into the repository. The `/public/audio` folder used by the
prototype is a local-development convenience only and does not ship to production.

1. `POST /api/audio-files` records the name and file details and returns a short-lived
   signed upload URL.
2. The browser uploads the file straight to S3 with that URL.
3. `PATCH /api/audio-files/{audioFileId}` marks the file ready once the upload succeeds.

`GET /api/audio-files` returns only ready files, each with a signed playback URL, so the
browser never needs its own credentials for the bucket.

---

## Build and Environments

`amplify.yml` at the repository root is the build spec Amplify Hosting uses: `npm ci`,
then `npm run build`, publishing the `dist/` folder.

Because the app is a single-page app using client-side routing, Amplify Hosting also needs a
rewrite rule so deep links do not 404. In the Amplify console, under **Rewrites and
redirects**, add:

```text
Source:  </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|mp3|wav)$)([^.]+$)/>
Target:  /index.html
Type:    200 (Rewrite)
```

Amplify Hosting creates one full environment per connected branch. `production` is the
deployed environment; feature branches get their own isolated backend, so schema or
endpoint changes on a branch never affect production.

---

## Superseded Choices

The earlier stack notes assumed Next.js API routes, PostgreSQL, Prisma, and Clerk.
Those are replaced by API Gateway + Lambda, DynamoDB, and Cognito respectively. The
frontend stack (React, TypeScript, Vite, Tailwind, shadcn/ui) is unchanged.
