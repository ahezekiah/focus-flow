# FocusFlow

FocusFlow is a productivity and deep-work web application built to help students, developers, and professionals stay focused without constantly switching between multiple apps.

Instead of using a separate timer, task list, music player, ambient sound app, and focus tracker, FocusFlow combines these tools into one workspace.

Users can:

* Create an account
* Complete a personalized onboarding flow
* Create focus sessions
* Choose a session duration
* Set an objective
* Select a task
* Choose background audio
* Start, pause, resume, and complete focus sessions
* Create and manage tasks
* Upload custom audio files
* Create playlists
* Select a default playlist
* Play uploaded audio
* Browse focus music categories
* Mix ambient sounds
* Change dashboard themes
* View focus statistics and achievements

The project uses a **React + TypeScript frontend** and an **AWS Amplify Gen 2 backend**.

---

# Project Overview

FocusFlow is designed around the idea of creating one dedicated space for focused work.

A typical workflow looks like:

```text
Create Account
      ↓
Complete Onboarding
      ↓
Open Dashboard
      ↓
Choose a Task
      ↓
Configure Focus Session
      ↓
Choose Music / Playlist
      ↓
Review Session
      ↓
Start Timer
      ↓
Pause / Resume
      ↓
Complete Session
      ↓
Session Saved to AWS
```

The application contains both local and cloud-based data.

Some interface preferences and account information are stored locally in the browser, while important backend functionality such as audio files, playlists, authentication, and focus sessions uses AWS services.

---

# Main Features

## Focus Sessions

FocusFlow allows users to configure a focus session before beginning.

A session contains:

```text
Duration
Objective
Task
Background Audio
Status
```

Users can select a preset duration or configure their own session length.

The current session lifecycle is:

```text
Setup
  ↓
Review
  ↓
Active
  ↓
Paused
  ↓
Active
  ↓
Complete
```

Session statuses saved by the backend include:

```text
configured
in_progress
paused
completed
```

---

## Session Setup

Before starting a focus session, the user selects:

* Session length
* Objective
* Task
* Optional playlist or audio track

The application validates the required fields before allowing the session to continue.

The main session configuration is represented by:

```ts
interface FocusConfig {
  duration: number;
  objective: string;
  task: string;

  audio?: {
    id: string;
    name: string;
    type: "playlist" | "track";
  };
}
```

---

# Focus Timer

Once a session starts, FocusFlow runs a countdown timer.

The timer supports:

* Starting
* Pausing
* Resuming
* Completing the session
* Displaying the remaining time

Time is formatted into:

```text
MM:SS
```

For example:

```text
25:00
24:59
24:58
...
00:01
00:00
```

When the session reaches completion, its status can be updated in the backend.

---

# Tasks

FocusFlow includes a built-in task list.

Tasks contain:

```ts
interface AccountTask {
  id: number;
  text: string;
  done: boolean;
}
```

A task can therefore look like:

```json
{
  "id": 3,
  "text": "Practice React",
  "done": false
}
```

Users can use these tasks when configuring a focus session.

The project currently stores the account's task list with the account information in browser `localStorage`.

---

# Audio Files

FocusFlow allows signed-in users to upload their own background audio.

Supported file types include:

```text
MP3
WAV
OGG
M4A
```

The upload system uses:

* React frontend
* REST API
* AWS Lambda
* DynamoDB
* Amazon S3
* Pre-signed S3 URLs

---

# How Audio Uploading Works

Uploading audio follows this process:

```text
User chooses audio file
        ↓
Frontend sends audio metadata
        ↓
POST /audio-files
        ↓
Lambda creates DynamoDB record
        ↓
Lambda creates temporary S3 upload URL
        ↓
Browser uploads file directly to S3
        ↓
Frontend sends PATCH request
        ↓
Audio status becomes "ready"
        ↓
File appears in Audio Files
```

The frontend starts the process with:

```ts
addAudioFile(name, file)
```

The initial API request sends information including:

```text
Name
Original file name
Content type
File size
```

The backend creates a unique ID and storage location such as:

```text
audio/{id}/{filename}
```

The file is then uploaded directly to S3 using a signed URL.

---

# Audio File Storage

Audio metadata is stored in DynamoDB.

A typical audio record contains:

```text
id
name
fileName
contentType
sizeBytes
storageKey
status
addedAt
```

Possible upload statuses include:

```text
uploading
ready
```

Only audio marked as:

```text
ready
```

is treated as available for playback.

---

# Secure Audio Playback

FocusFlow does not expose the S3 bucket directly to the browser.

Instead, Lambda generates temporary signed playback URLs.

The architecture is:

```text
Browser
   ↓
REST API
   ↓
Lambda
   ↓
S3
   ↓
Temporary Signed URL
   ↓
Browser Audio Player
```

This means the application can play stored audio without making the entire S3 bucket public.

---

# Playlists

Users can organize uploaded audio files into playlists.

A playlist includes:

```text
ID
Name
Selected Audio Files
Default Status
Creation Date
```

Users can:

* Create playlists
* Choose which uploaded files are included
* Play playlists
* Mark a playlist as the default playlist

---

# Creating a Playlist

The application requires:

```text
Playlist Name
At Least One Audio File
```

The frontend calls:

```ts
createPlaylist(name, audioFileIds)
```

which sends:

```http
POST /playlists
```

The backend then stores the playlist in DynamoDB.

---

# Default Playlist

FocusFlow supports a default playlist.

The frontend can request it using:

```http
GET /playlists/default
```

The backend first checks for a playlist where:

```text
isDefault = true
```

If no explicit default exists, it falls back to the first available playlist.

If no playlists exist, the API returns:

```text
No playlist has been created yet
```

---

# Ambient Sounds

The dashboard also contains ambient sound options.

Current sounds include:

```text
Rain
Fireplace
Café
Wind
Ocean
Forest
Thunder
Birds
```

Each ambient sound has its own volume value.

Example:

```text
Rain        40%
Fireplace   20%
Café        60%
Wind        10%
```

FocusFlow also contains preset sound environments such as:

```text
My Cozy Room
Rain · Café · Fireplace
```

```text
Forest Morning
Forest · Birds · Wind
```

```text
Study Hall
Café · Wind
```

---

# Music Categories

The dashboard contains several productivity-oriented music categories.

Current categories include:

```text
Programming
Writing
Reading
Relaxation
```

Examples include:

```text
Programming
├── Frontend Flow
├── Backend Grind
├── Algorithm Mode
├── UI Design
├── Debug Session
└── Sprint Mode
```

and:

```text
Relaxation
├── Sleep
├── Meditation
├── Stretching
└── Break Time
```

These sections help organize the different focus experiences available through the dashboard.

---

# Themes

FocusFlow contains a theme selection system.

Theme-related code can be found inside:

```text
src/dash/themes.ts
src/dash/ThemeSelectionView.tsx
```

Users can change the visual appearance of the dashboard.

The selected theme controls interface properties such as:

```text
Background
Cards
Foreground text
Muted text
Borders
Primary color
Accent color
Overlays
```

This allows the dashboard to visually change without rebuilding every component individually.

---

# Analytics

FocusFlow also contains an analytics area for displaying productivity information.

The dashboard contains concepts such as:

```text
Focus time
Daily goals
Progress
Streaks
Achievements
Activity heatmap
```

The current default daily focus goal is:

```text
4 hours per day
```

or:

```text
240 minutes
```

---

# Achievements

The project includes achievement-style productivity milestones.

Examples include:

```text
Early Bird
Focused before 8 AM for 7 days
```

```text
Deep Thinker
100 hours of focused work
```

```text
Night Owl
Focused after midnight
```

```text
On Fire
30-day streak achieved
```

```text
Speed Runner
10 sessions in one day
```

```text
Precision
50 sessions without skipping
```

Some of the current analytics and achievement data is demonstration/static data rather than fully calculated from stored sessions.

---

# Authentication

FocusFlow uses two account-related systems.

## Local Account Information

Basic application account information is stored in browser `localStorage`.

The local account contains information such as:

```text
Name
Email
Password hash
Onboarding progress
Selected onboarding options
Tasks
```

The application uses SHA-256 through the browser's Web Crypto API to hash the locally stored password.

---

## AWS Cognito Identity

Cloud features also use **Amazon Cognito** through AWS Amplify.

Cognito is required for protected REST API operations such as:

```text
Uploading audio
Creating playlists
Changing playlists
Creating sessions
Updating sessions
Reading saved sessions
```

When a FocusFlow user registers, the application attempts to create the corresponding Cognito identity.

When the user signs in later, FocusFlow restores that Cognito session.

---

# Sign-In Flow

The sign-in flow is approximately:

```text
Enter Email + Password
       ↓
Check Local Account
       ↓
Verify Local Password Hash
       ↓
Restore Cognito Identity
       ↓
Set Local Session
       ↓
Open Dashboard
```

If the Cognito identity does not exist yet, FocusFlow can create it during the sign-in process.

---

# Onboarding

New users complete a guided onboarding process.

The onboarding steps currently include:

```text
Sessions
Tasks
Playlist
Theme
Done
```

These correspond to:

```ts
type OnboardingStep =
  | "sessions"
  | "tasks"
  | "playlist"
  | "theme"
  | "done";
```

Older onboarding values are also migrated automatically.

For example:

```text
projects → tasks
music    → playlist
streaks  → done
```

This prevents accounts created with earlier versions of the application from breaking.

---

# Application Routes

The main routing is handled with React Router.

Current routes include:

```text
/
```

Home page.

```text
/signin
```

Sign-in screen.

```text
/onboarding
```

Account creation and onboarding.

```text
/dash
```

Main FocusFlow dashboard.

---

# Route Protection

FocusFlow automatically redirects users depending on account status.

The logic is approximately:

```text
Not Signed In
      ↓
Home / Sign In

Signed In
But Onboarding Incomplete
      ↓
Onboarding

Signed In
Onboarding Complete
      ↓
Dashboard
```

Users cannot access the main dashboard until onboarding has been completed.

---

# Dashboard Navigation

The dashboard contains several sections.

Current navigation types include:

```ts
type Nav =
  | "home"
  | "focus"
  | "music"
  | "audio"
  | "playlists"
  | "sounds"
  | "analytics"
  | "themes";
```

This means the dashboard provides access to:

* Home
* Focus sessions
* Music
* Audio files
* Playlists
* Ambient sounds
* Analytics
* Themes

---

# Technology Stack

## Frontend

The frontend uses:

* React 19
* TypeScript
* Vite
* React Router
* Tailwind CSS
* Radix UI
* Lucide React
* Recharts
* React Hook Form
* date-fns
* Sonner
* AWS Amplify

---

## Backend

The backend uses:

* AWS Amplify Gen 2
* AWS CDK
* Amazon API Gateway
* AWS Lambda
* Amazon DynamoDB
* Amazon S3
* Amazon Cognito
* AWS SDK for JavaScript

---

# Architecture

The application architecture looks approximately like this:

```text
                    FocusFlow
                        │
                        ▼
              React + TypeScript
                        │
                   React Router
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
     localStorage              AWS Amplify
          │                           │
          │                           ▼
     Local account               Cognito
     Tasks                      Authentication
     Onboarding                     │
                                    ▼
                              API Gateway
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
             Audio Lambda     Playlist Lambda   Session Lambda
                   │                │                │
             ┌─────┴─────┐     ┌────┴─────┐          │
             ▼           ▼     ▼          ▼          ▼
         DynamoDB        S3 DynamoDB      S3      DynamoDB
```

---

# REST API

FocusFlow uses REST APIs rather than GraphQL.

The REST API is created in:

```text
amplify/backend.ts
```

The API Gateway stage is:

```text
/api
```

The generated API URL is written into:

```text
amplify_outputs.json
```

The frontend automatically reads the API URL from that file.

---

# API Endpoints

## Audio Files

```http
GET /audio-files
```

Returns available audio files.

```http
POST /audio-files
```

Creates an audio upload record and signed upload URL.

Requires authentication.

```http
GET /audio-files/{audioFileId}
```

Returns a specific audio file.

```http
PATCH /audio-files/{audioFileId}
```

Updates an audio file, such as marking it ready.

Requires authentication.

---

## Playlists

```http
GET /playlists
```

Lists playlists.

```http
POST /playlists
```

Creates a playlist.

Requires authentication.

```http
GET /playlists/default
```

Returns the default playlist.

```http
GET /playlists/{playlistId}
```

Returns a specific playlist.

```http
PATCH /playlists/{playlistId}
```

Updates a playlist.

Used for setting a playlist as the default.

Requires authentication.

---

## Sessions

```http
GET /sessions
```

Returns sessions belonging to the authenticated user.

```http
POST /sessions
```

Creates a focus session.

```http
GET /sessions/{sessionId}
```

Returns one session belonging to the authenticated user.

```http
PATCH /sessions/{sessionId}
```

Updates a session status.

All session endpoints require authentication.

---

# DynamoDB Tables

The Amplify backend creates three main DynamoDB tables.

## Audio File Table

Stores:

```text
Audio metadata
S3 storage keys
Upload status
File size
Content type
Creation date
```

---

## Playlist Table

Stores:

```text
Playlist ID
Playlist name
Audio file IDs
Default playlist status
Creation date
```

---

## Session Table

Stores:

```text
Session ID
User ID
Duration
Objective
Task
Audio selection
Status
Created date
Started date
Completed date
```

---

# Session Ownership

Sessions are associated with the authenticated Cognito user.

Each session stores:

```text
userId
```

which comes from the Cognito:

```text
sub
```

claim.

When retrieving or modifying a session, the backend confirms that the currently signed-in user owns the session.

This prevents one user from retrieving another user's focus sessions.

---

# Project Structure

The main project structure looks like:

```text
focus-flow-production/
│
├── amplify/
│   │
│   ├── auth/
│   │   ├── pre-sign-up/
│   │   │   ├── handler.ts
│   │   │   └── resource.ts
│   │   └── resource.ts
│   │
│   ├── functions/
│   │   ├── audio-files/
│   │   │   ├── handler.ts
│   │   │   └── resource.ts
│   │   │
│   │   ├── playlists/
│   │   │   ├── handler.ts
│   │   │   └── resource.ts
│   │   │
│   │   └── sessions/
│   │       ├── handler.ts
│   │       └── resource.ts
│   │
│   ├── storage/
│   │   └── resource.ts
│   │
│   ├── backend.ts
│   └── tsconfig.json
│
├── components/
│   └── Rain.tsx
│
├── docs/
│   ├── DEFINITION_OF_READY.md
│   ├── DEFINITON_OF_DONE.md
│   ├── PulltoProd.md
│   └── process.md
│
├── e2e/
│   ├── README.md
│   ├── jest.config.ts
│   ├── package.json
│   ├── playwright.config.ts
│   └── tsconfig.json
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── assets/
│   │   └── hero.png
│   │
│   ├── components/
│   │   ├── figma/
│   │   └── ui/
│   │
│   ├── dash/
│   │   ├── AudioAccountPanel.tsx
│   │   ├── AudioFilesView.tsx
│   │   ├── PlaylistsView.tsx
│   │   ├── ThemeSelectionView.tsx
│   │   └── themes.ts
│   │
│   ├── lib/
│   │   ├── accounts.ts
│   │   ├── ambientMusic.ts
│   │   ├── amplify.ts
│   │   ├── api.ts
│   │   ├── identity.ts
│   │   └── useSignedIn.ts
│   │
│   ├── App.tsx
│   ├── Dashboard.tsx
│   ├── Home.tsx
│   ├── Onboarding.tsx
│   ├── SignIn.tsx
│   ├── main.tsx
│   └── index.css
│
├── amplify.yml
├── amplify_outputs.json
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# Important Files

## `src/App.tsx`

Controls the main application routes and redirects users depending on authentication and onboarding status.

---

## `src/Dashboard.tsx`

Contains most of the main FocusFlow dashboard logic, including:

* Focus sessions
* Timer
* Tasks
* Music
* Audio playback
* Ambient sounds
* Analytics
* Navigation
* Session state

---

## `src/lib/api.ts`

Contains the frontend REST API functions.

Examples include:

```ts
listAudioFiles()
addAudioFile()
listPlaylists()
getDefaultPlaylist()
createPlaylist()
makePlaylistDefault()
createSession()
updateSessionStatus()
listSessions()
```

---

## `src/lib/accounts.ts`

Handles local FocusFlow account data including:

```text
Accounts
Password hashes
Browser sessions
Tasks
Onboarding progress
```

---

## `src/lib/identity.ts`

Handles AWS Cognito authentication.

Functions include:

```ts
registerIdentity()
restoreIdentity()
releaseIdentity()
```

---

## `src/lib/amplify.ts`

Loads:

```text
amplify_outputs.json
```

and configures AWS Amplify.

It also retrieves the generated REST API URL.

---

## `amplify/backend.ts`

Defines the main AWS infrastructure.

This includes:

* DynamoDB tables
* REST API Gateway
* Lambda integrations
* Cognito authorization
* S3 permissions
* API routes
* Backend environment variables

---

# Running the Project Locally

There are two ways to run FocusFlow locally.

## Option 1 — Frontend Only

The application can start without an AWS sandbox.

This is useful when working on:

* UI
* Themes
* Layout
* Navigation
* Some local account functionality

Backend-dependent features will not fully work without AWS configuration.

---

## Option 2 — Full Application With AWS Backend

For the full experience, run an Amplify sandbox locally alongside the Vite frontend.

This enables:

```text
Cognito authentication
Audio uploads
S3 storage
Playlists
Focus session persistence
REST API
DynamoDB
```

---

# Prerequisites

Install:

* Node.js
* npm
* Git
* AWS CLI
* An AWS account with permission to deploy Amplify resources

Check Node:

```bash
node --version
```

Check npm:

```bash
npm --version
```

Check AWS CLI:

```bash
aws --version
```

---

# 1. Clone the Repository

```bash
git clone <YOUR-REPOSITORY-URL>
```

Move into the project:

```bash
cd focus-flow-production
```

If you downloaded the project as a ZIP instead, extract it and open the project folder.

---

# 2. Install Dependencies

Run:

```bash
npm install
```

This installs the React frontend and Amplify development dependencies.

---

# 3. Run Frontend Only

For UI-only development:

```bash
npm run dev
```

Vite will start the development server.

The terminal will display an address similar to:

```text
http://localhost:5173
```

Open that address in your browser.

---

# 4. Configure AWS Credentials

To run the backend, your computer must be authenticated with AWS.

If your team uses AWS SSO:

```bash
aws configure sso
```

Follow the prompts for the appropriate AWS account and profile.

Then log in with:

```bash
aws sso login --profile <YOUR-PROFILE>
```

Verify access with:

```bash
aws sts get-caller-identity --profile <YOUR-PROFILE>
```

---

# 5. Start the Amplify Sandbox

From the project root, run:

```bash
npx ampx sandbox
```

If using a named AWS profile:

```bash
npx ampx sandbox --profile <YOUR-PROFILE>
```

You can also use a sandbox identifier:

```bash
npx ampx sandbox --identifier yourname
```

The sandbox creates an isolated development backend in AWS.

---

# 6. Amplify Outputs

Once the sandbox successfully deploys, Amplify generates:

```text
amplify_outputs.json
```

This file contains the frontend configuration required to communicate with the deployed backend.

The application automatically reads it.

You do not need to manually copy API Gateway URLs into the frontend.

---

# 7. Start the Frontend

Keep the Amplify sandbox running.

Open another terminal in the project directory and run:

```bash
npm run dev
```

You should now have:

```text
Terminal 1
npx ampx sandbox
```

and:

```text
Terminal 2
npm run dev
```

Then open:

```text
http://localhost:5173
```

or whatever URL Vite displays.

---

# Recommended Local Development Setup

A typical development session looks like:

```text
Terminal 1
────────────────────────────

npx ampx sandbox --identifier yourname
```

```text
Terminal 2
────────────────────────────

npm run dev
```

Then use the browser application normally.

---

# Creating an Account Locally

Once FocusFlow is running:

1. Open the home page.
2. Choose the account creation/onboarding flow.
3. Enter your name.
4. Enter your email.
5. Enter a password.
6. Complete the onboarding process.
7. Enter the dashboard.

The password policy requires:

```text
At least 8 characters
At least one lowercase letter
At least one uppercase letter
At least one number
At least one special character
```

Example:

```text
FocusFlow123!
```

---

# Using FocusFlow

## Start a Focus Session

From the dashboard:

1. Open the Focus section.
2. Choose a session duration.
3. Enter your objective.
4. Choose or enter a task.
5. Select optional background audio.
6. Review the session.
7. Start the session.
8. Pause or resume as necessary.
9. Complete the session.

---

# Adding Audio

To add custom audio:

1. Sign in.
2. Open **Audio Files**.
3. Choose **Add Audio**.
4. Enter the audio name.
5. Select an MP3, WAV, OGG, or M4A file.
6. Upload the file.
7. Wait for the upload to finish.
8. The audio becomes available once its status changes to `ready`.

The file is saved to Amazon S3 and its metadata is stored in DynamoDB.

---

# Creating a Playlist

To create a playlist:

1. Upload one or more audio files.
2. Open **Playlists**.
3. Choose **Create Playlist**.
4. Enter a playlist name.
5. Select the audio files to include.
6. Create the playlist.

You can also choose:

```text
Make Default
```

to make that playlist the default.

---

# Common Commands

## Install Packages

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

---

## Build Project

```bash
npm run build
```

---

## Preview Production Build

```bash
npm run preview
```

---

## Run ESLint

```bash
npm run lint
```

---

## Start Amplify Sandbox

```bash
npx ampx sandbox
```

---

## Start Named Sandbox

```bash
npx ampx sandbox --identifier yourname
```

---

# Building for Production

Run:

```bash
npm run build
```

The build process runs:

```text
TypeScript compiler
        ↓
Vite production build
```

The generated production application is placed in:

```text
dist/
```

---

# AWS Amplify Deployment

The repository contains:

```text
amplify.yml
```

which defines the Amplify Hosting build process.

The project can therefore be deployed using AWS Amplify Hosting.

Amplify can build both the frontend and backend resources during deployment.

---

# Backend Resource Flow

## Audio

```text
React
 ↓
API Gateway
 ↓
Audio Lambda
 ├── DynamoDB
 └── S3
```

---

## Playlist

```text
React
 ↓
API Gateway
 ↓
Playlist Lambda
 ├── Playlist DynamoDB Table
 ├── Audio DynamoDB Table
 └── S3 Signed Playback URLs
```

---

## Focus Session

```text
React
 ↓
Cognito Authentication
 ↓
API Gateway
 ↓
Session Lambda
 ↓
Session DynamoDB Table
```

---

# Security

Several parts of the backend are protected using Cognito.

Public routes include operations such as retrieving available playlists and audio reference information.

Protected operations include:

```text
POST /audio-files
PATCH /audio-files/{id}

POST /playlists
PATCH /playlists/{id}

GET /sessions
POST /sessions
GET /sessions/{id}
PATCH /sessions/{id}
```

Protected requests include a Cognito authorization token.

---

# Backend Availability

FocusFlow is designed so the frontend can still load even if an Amplify backend has not been deployed.

The code checks:

```ts
isBackendConfigured
```

before performing cloud operations.

The value becomes true once:

```text
amplify_outputs.json
```

exists and contains valid deployed backend information.

This makes it possible to develop much of the UI before setting up AWS.

---

# Current Limitations

Some parts of FocusFlow are still closer to prototype/demo functionality than fully persistent production functionality.

For example:

* Some dashboard analytics use static or generated demonstration data
* The heatmap is randomly generated
* Some recommended music categories use static data
* Some achievements are currently predefined
* Tasks are currently stored with the local browser account
* Local account data depends on browser `localStorage`
* Full backend functionality requires AWS
* Uploaded audio depends on generated signed S3 URLs
* The application requires Cognito authentication for protected API requests

---

# Future Improvements

Possible future additions include:

* Store tasks in DynamoDB
* Fully calculate analytics from real completed sessions
* Build real streak tracking
* Store achievement progress in the backend
* Add editable daily focus goals
* Add project-based task organization
* Add recurring tasks
* Add audio deletion
* Add playlist editing
* Add playlist deletion
* Add drag-and-drop playlist ordering
* Add playlist cover art
* Add full audio waveform support
* Add more ambient sound controls
* Add user profile settings
* Add password recovery
* Add email verification flow
* Add session history
* Add calendar integration
* Add mobile-friendly focus controls
* Add notification support
* Add Pomodoro cycles
* Add break timers
* Add statistics by task
* Add statistics by project
* Add cloud-based user preferences

---

# Educational and Development Concepts

FocusFlow demonstrates a wide range of full-stack development concepts.

## Frontend

```text
React
TypeScript
React Router
Component State
Hooks
Form Validation
Conditional Rendering
Audio Playback
Timers
Responsive UI
Theme Systems
Reusable UI Components
```

## Backend

```text
AWS Amplify Gen 2
AWS CDK
API Gateway
REST APIs
AWS Lambda
DynamoDB
Amazon S3
Cognito
IAM Permissions
Environment Variables
Pre-signed URLs
```

## Application Concepts

```text
Authentication
Authorization
File Uploads
Cloud Storage
Database Persistence
Task Management
Focus Timers
Session State
Playlist Management
Local Storage
User Onboarding
```

---

# Quick Start

For frontend-only development:

```bash
git clone <YOUR-REPOSITORY-URL>

cd focus-flow-production

npm install

npm run dev
```

For full-stack development:

```bash
git clone <YOUR-REPOSITORY-URL>

cd focus-flow-production

npm install
```

Start the backend:

```bash
npx ampx sandbox --identifier yourname
```

Then in another terminal:

```bash
npm run dev
```

Open the local address provided by Vite, normally:

```text
http://localhost:5173
```

---

# Summary

**FocusFlow** is a full-stack productivity application designed to combine the tools needed for focused work into one dashboard.

The application combines:

```text
Focus Timer
     +
Task Management
     +
Custom Audio
     +
Playlists
     +
Ambient Sounds
     +
Themes
     +
Analytics
     +
Cloud Session Storage
```

The frontend is built with:

```text
React + TypeScript + Vite
```

and the backend uses:

```text
AWS Amplify Gen 2
API Gateway
Lambda
DynamoDB
S3
Cognito
```

The main architecture is:

```text
User
 ↓
React Frontend
 ↓
AWS Cognito
 ↓
REST API
 ↓
Lambda
 ↓
DynamoDB / S3
```

To run the complete project locally:

```bash
npm install
npx ampx sandbox --identifier yourname
```

and in another terminal:

```bash
npm run dev
```

Once the app opens, create an account, complete onboarding, and enter the FocusFlow dashboard to start building and tracking focused work sessions.

> **Portfolio demo:** The complete focus-session, task, theme, playlist, and audio experience is available for demonstration. Profile preferences, onboarding progress, and tasks are intentionally browser-local in this version. Analytics are labeled sample preview data. See [PORTFOLIO_DEMO.md](PORTFOLIO_DEMO.md) for the presentation flow and production follow-up work.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-FF9900?logo=awsamplify&logoColor=white)](https://aws.amazon.com/amplify/)