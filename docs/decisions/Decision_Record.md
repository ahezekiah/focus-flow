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
