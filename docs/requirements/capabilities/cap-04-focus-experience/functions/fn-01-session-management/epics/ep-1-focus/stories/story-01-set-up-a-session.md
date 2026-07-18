# Story-01: Set Up a Session

## User Story

**As a** User,
**I want** to set up a session
**so that** I can choose my duration, objective, project, and task before I start focusing.

## Acceptance Criteria

- Duration options include 25, 45, 60, 90 minutes, or Custom
- User can optionally link the session to an existing project and task

## Given / When / Then

**Given** a user is on the session setup screen
**When** they select "45 minutes" as the duration
**Then** the session timer is configured to count down from 45 minutes.

## Given / When / Then

**Given** the user has pre-existing projects and tasks saved in their profile.
**When** they configure a new session and select a specific project and task from the dropdowns.
**Then** the session configuration associates itself with that project and task ID.
