# Architecture

Applies to all code, configuration, and technical documentation in this project.
It does **not** apply to anything under `docs/requirements/` — those documents follow
`always_enforce.md`, which keeps architecture and technical terminology out of requirements.

Full reference: `docs/tech-stack/AWS_Architecture.md`. Decisions: `docs/decisions/Decision_Record.md`.

## Platform

1. The app deploys to **AWS Amplify**. Amplify Hosting serves the frontend; the backend is
   defined with **Amplify Gen 2** in TypeScript under `amplify/`.
2. Use AWS services already in the stack before adding a third-party one: **Cognito** for auth,
   **S3** for files, **DynamoDB** for data, **Lambda** for server logic.
3. Do not reintroduce Next.js, PostgreSQL, Prisma, or Clerk. They were replaced — see DR-02.

## API

4. The client-facing API is **REST** over **API Gateway + Lambda**. Resource-per-endpoint,
   standard HTTP verbs, plural hyphenated lowercase paths (`/api/audio-files/{audioFileId}`).
5. **Zero GraphQL.** No GraphQL documents, schemas, resolvers, or clients anywhere in the
   project — frontend or backend. No `generateClient()`, no `.graphql` files.
6. **Do not use AppSync.** It was considered and rejected (DR-03) because it is GraphQL-only.
   Data is DynamoDB, read and written from Lambda handlers with the AWS SDK. Real-time features
   use WebSockets on API Gateway. If a task appears to require AppSync or GraphQL, say so and
   ask — do not introduce it.
7. Errors travel on the HTTP status code. Do not return `200` with an error body.
8. Every endpoint requires a Cognito token except public reference data (themes, default playlists).

## Frontend

9. Stack is **React + TypeScript + Vite + Tailwind + shadcn/ui**. Keep it.
10. Uploaded audio and images live in **S3**, never committed to the repository.
    `/public/audio` is local development only.
11. Keep API calls out of components — put fetch logic in a dedicated module so endpoints
    are changed in one place.

## When making changes

12. If a request conflicts with a decision record entry, name the conflict before implementing.
13. A change to the platform, API style, or auth model gets a new entry in
    `docs/decisions/Decision_Record.md`.
