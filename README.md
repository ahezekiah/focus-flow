
# focus-flow

FocusFlow is a web application designed to help students and professionals stay focused while working. Instead of switching between a music app, a timer, a task list, and/or a habit tracker, Focus Flow combines these tools into one workspace that encourages deep, distraction-free work.

## Architecture

Focus Flow runs on AWS Amplify. The frontend is a React + TypeScript + Vite single-page app
served by Amplify Hosting; the backend is defined with Amplify Gen 2. The API is **REST** on
API Gateway + Lambda, with data in DynamoDB, auth through Cognito, and uploaded audio in S3.
There is no GraphQL in the stack.

- [AWS architecture reference](docs/tech-stack/AWS_Architecture.md)
- [Tech stack](docs/tech-stack/TeckStack.md)
- [Decision record](docs/decisions/Decision_Record.md)

`amplify.yml` at the repository root is the Amplify Hosting build spec.

## Onboarding: AWS Amplify Access (Ben's Account)

To get access to the project's AWS Amplify account for deployments and environment management, follow these steps:

### Request access to the existing Amplify account

1. **Configure access** — Configure access to your newly created account. You should click th elink in your email, add a password, and sign in with that account, confirming you can see the Amplify dashboard.
2. **Configure AWS SSO locally**

   Run:

   ```bash
   aws configure sso
   ```

   When prompted, enter:

   - **SSO session name**: `Your first name, all lowercase`
   - **SSO start URL**: `https://d-9a675a926f.awsapps.com/start`
   - **SSO region**: the region where IAM Identity Center is hosted (us-east-2)
   - **SSO registration scopes**: accept the default (`sso:account:access`)
3. **Authenticate via the browser**

   The CLI will open a browser window to the SSO portal URL above. Log in with your credentials and approve the CLI request.
4. **Verify access**

   ```bash
   aws sts get-caller-identity --profile focusflow-amplify
   ```

   This should return your assumed role and account ID, confirming SSO is configured correctly.

> Note: SSO sessions expire periodically. If commands start failing with authentication errors, re-run `aws sso login --profile focusflow-amplify`.
