# focus-flow
FocusFlow is a web application designed to help students and professionals stay focused while working. Instead of switching between a music app, a timer, a task list, and/or a habit tracker, Focus Flow combines these tools into one workspace that encourages deep, distraction-free work.

## Onboarding: AWS Amplify Access (Ben's Account)

To get access to the project's AWS Amplify account for deployments and environment management, follow these steps:

1. **Request access** — Ask Ben to add your email (`<YOUR_EMAIL>`) as a user in IAM Identity Center for the account. He'll need to confirm your login email is: `<AWS_ACCOUNT_EMAIL>`.

2. **Configure AWS SSO locally**

   Run:
   ```bash
   aws configure sso
   ```

   When prompted, enter:
   - **SSO session name**: `amplify-admin` (or a name of your choosing)
   - **SSO start URL**: `https://d-9a675a926f.awsapps.com/start` 
   - **SSO region**: the region where IAM Identity Center is hosted (us-east-2)
   - **SSO registration scopes**: accept the default (`sso:account:access`)

3. **Authenticate via the browser**

   The CLI will open a browser window to the SSO portal URL above. Log in with your credentials and approve the CLI request.

4. **Select the account and role**

   Once authenticated, choose the Amplify account and the role Ben has assigned you (e.g. `Developer`, `Admin`).

5. **Name your profile**

   Give the profile a memorable name (e.g. `focusflow-amplify`) — you'll use this with `--profile focusflow-amplify` in future AWS CLI commands, or set it as your default via `AWS_PROFILE`.

6. **Verify access**

   ```bash
   aws sts get-caller-identity --profile focusflow-amplify
   ```

   This should return your assumed role and account ID, confirming SSO is configured correctly.

> Note: SSO sessions expire periodically. If commands start failing with authentication errors, re-run `aws sso login --profile focusflow-amplify`.
