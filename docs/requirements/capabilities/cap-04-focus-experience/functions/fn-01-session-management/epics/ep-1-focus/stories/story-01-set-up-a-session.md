# Story-01: Set Up a Session

## User Story

**As a** User,
**I want** to set up a session
**so that** I can choose the duration, objective, task, and background audio I want before I start focusing.

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
- Background audio can be selected for the session

  **Given** a user is setting up a new session
  **When** they select a playlist or an individual audio track
  **Then** that selection is saved with the session and shown back to them before they start.
- The session length, objective, task, and background audio are each optional

  **Given** a user is setting up a new session with any combination of the session length, objective, task, and background audio provided or left empty
  **When** they choose to start the session
  **Then** the session starts using only the details they provided and they are never asked to fill in the ones they left empty.
