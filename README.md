
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

### Running with a backend

The backend lives in [amplify/](amplify/). To get your own isolated copy while developing:

```bash
npm install    
npx ampx sandbox      # deploys your sandbox and writes amplify_outputs.json
npm run dev           # in a second terminal
```

`amplify_outputs.json` is generated, git-ignored, and picked up automatically. Without it the
app still runs — pages that need the backend say so instead of failing.

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

## Repository access

This repository is private, so Git has to be signed in to a GitHub account that has been granted access before you can clone, fetch, or push. If you are not signed in — or you are signed in as an account without access — GitHub hides the repository entirely and Git reports:

```
remote: Repository not found.
```

That message means "not authorized," not "does not exist." If you see it, ask the repository owner to add your GitHub account as a collaborator, then sign in using one of the options below.

### Option 1 — Sign in through the browser (recommended)

Git Credential Manager ships with Git for Windows and stores the token in Windows Credential Manager rather than a plaintext file.

```powershell
git config --global credential.helper manager
git ls-remote origin HEAD
```

The second command opens a browser window for the GitHub sign-in. Once it completes you should see a commit SHA instead of an error, and future Git commands will reuse the saved login.

On macOS or Linux, use the platform helper instead:

```bash
git config --global credential.helper osxkeychain   # macOS
git config --global credential.helper libsecret     # Linux
git ls-remote origin HEAD
```

### Option 2 — Sign in with a personal access token

1. Create a token at https://github.com/settings/tokens. A fine-grained token needs read (and write, if you plan to push) access to this repository; a classic token needs the **`repo`** scope, or it will not be able to see private repositories at all.
2. Use the token as your password the next time Git prompts you, with your GitHub username as the username.

To have Git remember it:

```powershell
git config --global credential.helper store
```

This writes the token in plaintext to `~/.git-credentials`, so prefer Option 1 on shared machines.

### Option 3 — Sign in with the GitHub CLI

```powershell
winget install --id GitHub.cli    # or: brew install gh
gh auth login
gh auth setup-git
```

Choose **GitHub.com** → **HTTPS** → **Login with a web browser** when prompted. `gh auth setup-git` points Git at the same credentials.

### Troubleshooting

- **Still "Repository not found" after signing in.** The login worked but the account does not have access. Confirm which account Git is using with `gh auth status`, or open the repository URL in a browser while signed in as that account, then request a collaborator invite.
- **The wrong account is cached.** Clear the old credentials and repeat the sign-in: on Windows, remove the `git:https://github.com` entry from Credential Manager (Control Panel → Credential Manager → Windows Credentials) and delete `~/.git-credentials` if it exists; elsewhere, run `git credential-osxkeychain erase` or delete the matching keyring entry.
- **A token that used to work now fails.** Personal access tokens expire. Generate a new one and repeat Option 2.
- **Check which remote you are pointed at.** Run `git remote -v` — a fork and the upstream repository have separate access lists, so access to one does not grant access to the other.

### Sign In to AWS
An AWS account: if you don't already have one follow the Setup Your Environment tutorial. `https://docs.aws.amazon.com/hands-on/latest/setup-environment/setup-environment.html`
Configure your AWS profile for local development.
