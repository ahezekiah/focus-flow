# Story-02: Starting a Session

## User Story
**As a** User,
**I want** to start a session
**so that** I can begin tracking my focused work time.

## Acceptance Criteria
- "Start Focus Session" button is accessible from the dashboard
- Starting a session begins the countdown timer immediately
- Session can be paused, resumed, and ended
- Ending a session saves startedAt, endedAt, durationMinutes, and status to the database

## Given / When / Then
**Given** a user has completed session setup
**When** they tap "Start"
**Then** the countdown timer begins and the session status is marked "in progress".
