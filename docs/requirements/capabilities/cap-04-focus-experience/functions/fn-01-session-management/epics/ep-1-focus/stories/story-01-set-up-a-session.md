# Story-01: Set Up a Session

## User Story

**As a** User,
**I want** to set up a session
**so that** I can choose my duration, objective, and task before I start focusing.

## Acceptance Criteria

- Session length can be chosen from 25, 45, 60, or 90 minutes, or set to a custom length

  **Given** a user is setting up a new session
  **When** they choose 45 minutes as the session length
  **Then** the session is set to run for 45 minutes.

  **Given** a user is setting up a new session
  **When** they choose a custom length and enter their own number of minutes
  **Then** the session is set to run for the length they entered.

- An objective can be recorded for the session

  **Given** a user is setting up a new session
  **When** they enter what they want to accomplish during the session
  **Then** that objective is saved with the session and shown back to them before they start.

- A task can be named for the session

  **Given** a user is setting up a new session
  **When** they name the task they will be working on
  **Then** that task is saved with the session and shown back to them before they start.

- A session cannot be created until a length, an objective, and a task have been provided

  **Given** a user has not yet provided a session length, an objective, and a task
  **When** they attempt to create the session
  **Then** the session is not created and they are told what is still missing.
