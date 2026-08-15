# focus-flow
FocusFlow is a web application designed to help students and professionals stay focused while working. Instead of switching between a music app, a timer, a task list, and/or a habit tracker, Focus Flow combines these tools into one workspace that encourages deep, distraction-free work.

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
