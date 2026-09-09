# FocusFlow Portfolio Demo

FocusFlow is a polished portfolio demonstration of a full-stack productivity workspace. It combines configurable focus sessions, task planning, custom themes, ambient audio, uploaded audio files, and playlists.

## Demo scope

- Authentication-backed AWS endpoints use Amazon Cognito.
- Focus sessions, uploaded audio metadata, playlists, and files use API Gateway, Lambda, DynamoDB, and S3.
- Profile preferences, onboarding progress, and tasks are stored in the current browser for this demo.
- The Analytics page is clearly labeled as a sample preview; its values are not presented as live user history.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Required quality check

```bash
npm run check
```

This runs ESLint and creates a production build. Do not deploy a commit unless this command passes.

## Portfolio presentation path

1. Open the landing page and explain the product goal.
2. Create an account and complete onboarding.
3. Add a task and configure a focus session.
4. Show the review, timer, pause, resume, and completion flow.
5. Upload an audio file and create a playlist.
6. Change the visual theme.
7. Show the Analytics preview and explain that live aggregation is planned production work.

## Production follow-up

Before marketing FocusFlow as a production service:

- Move profiles, onboarding progress, and tasks into owner-scoped cloud storage.
- Add password recovery.
- Make user audio private by default.
- Enforce file-upload quotas.
- Restrict CORS.
- Calculate analytics from completed sessions.