# Tech Stack

Deployment target is **AWS Amplify**. See [AWS_Architecture.md](AWS_Architecture.md) for how the
services fit together.

## Frontend

- **React**
- **TypeScript**
- **Vite**

**Reason:** Matches what is already built in this repository, and Amplify Hosting builds and serves a Vite single-page app directly from the connected branch.

---

## Styling

- **Tailwind CSS**
- **shadcn/ui**

**Reason:** Fast to build with, provides clean UI components, and makes it easy for multiple developers to maintain a consistent design.

---

## Animation

- **Framer Motion**

**Reason:** Great for dashboard transitions, focus session animations, cards, modals, and polished user interactions.

---

## Backend

- **AWS Amplify Gen 2**
- **API Gateway (REST) + AWS Lambda**

**Reason:** The backend is defined in TypeScript alongside the app and deployed per branch. API Gateway with Lambda gives us the REST endpoints the team already chose, without a separate hosting setup.

---

## API Style

- **REST**

**Reason:** Decided in the [Decision Record](../decisions/Decision_Record.md) — resource endpoints and standard HTTP verbs are faster for the team to build and debug in the time available.

---

## Data

- **Amazon DynamoDB**

**Reason:** Amplify Gen 2 provisions the tables alongside the rest of the backend, and Lambda handlers read and write them with the AWS SDK. No GraphQL layer is involved.

---

## Authentication

- **Amazon Cognito**

**Reason:** Built into Amplify and integrates directly with API Gateway authorization, so protecting an endpoint does not require a third-party service.

---

## Charts & Analytics

- **Recharts**

**Reason:** A lightweight React charting library that's perfect for displaying productivity analytics and dashboard data.

---

## Audio

- **HTML5 Audio API**

**Reason:** Provides everything needed for music playback, ambient sound loops, layered audio, and volume controls without requiring additional libraries.

---

## Hosting

- **AWS Amplify Hosting**

**Reason:** Builds and deploys straight from the connected Git branch, with a full isolated environment per branch and CloudFront delivery in front of the app.

---

## Storage

- **Amazon S3**

**Reason:** Uploaded audio files, theme images, and playlist artwork live in S3 rather than in the repository. The `/public/audio` folder remains a local-development convenience only.

---

# Final Stack Summary

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- HTML5 Audio API
- AWS Amplify (Hosting + Gen 2 backend)
- API Gateway (REST) + Lambda
- Amazon DynamoDB
- Amazon Cognito
- Amazon S3