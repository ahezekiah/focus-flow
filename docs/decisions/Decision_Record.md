# Decision Record

## DR-01: REST over GraphQL

We decided to use REST API's because it is better for us to use velocity wise for the next 5 weeks.
We considered the lambdas and api gateway and thought it would be better to learn and iterate better than graphql.

## DR-02: AWS Amplify as the deployment platform

We decided to deploy Focus Flow on AWS Amplify. Amplify Hosting builds the app from the
connected branch, and Amplify Gen 2 lets us define auth, data, storage, and functions in
TypeScript next to the app instead of standing up separate infrastructure.

This replaces the earlier plan of Next.js API routes, PostgreSQL, Prisma, and Clerk with
API Gateway + Lambda, DynamoDB, and Cognito. The frontend stack does not change.

## DR-03: No AppSync, no GraphQL anywhere

We considered AppSync and decided against it. AppSync is a GraphQL service with no REST mode,
so using it would reverse DR-01 no matter where it sat in the stack.

Data lives in DynamoDB, provisioned through Amplify Gen 2 and accessed from our Lambda handlers
with the AWS SDK. There is no GraphQL in this project — not in the frontend, not behind the
API. Real-time features, if we build them, use WebSockets on API Gateway.

## DR-04: One account, registered into Cognito

Focus Flow had two account systems. Registering and signing in created an account held in
the browser only, while adding audio files and building playlists needed a Cognito account.
Nothing in the app ever created the second one, so a customer who had just registered was
asked to sign in again, with different details, before they could add any audio at all.

Registration and sign-in now settle the Cognito identity as well, through `src/lib/identity.ts`.
An address that already has an identity is signed into rather than registered twice, and an
account made before this change gets its identity the first time it signs in.

A pre-sign-up trigger confirms accounts as they are created, so registration stays the single
step the onboarding story describes and never waits on an emailed code. Because Cognito's
password policy now applies at registration, the password rule on the registration screen asks
for the same thing the pool does: at least 8 characters with upper and lower case, a number
and a symbol.

The browser-held account is still what carries someone's setup progress and preferences.
Folding that into Cognito as user attributes is a later step, not this one.
