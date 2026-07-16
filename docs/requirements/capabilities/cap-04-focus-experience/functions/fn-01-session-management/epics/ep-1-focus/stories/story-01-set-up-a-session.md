# Story-01: Set Up a Session

## User Story
**As a** User,
**I want** to set up a session
**so that** I can choose my duration, objective, project, and task before I start focusing.

## Acceptance Criteria
- Duration options include 25, 45, 60, 90 minutes, or Custom
- Objective options include Coding, Homework, Reading, Writing, Design, Research, or Custom
- User can optionally link the session to an existing project and task
- Session setup saves userId, projectId, taskId, startedAt, durationMinutes, and objective

## Given / When / Then
**Given** a user is on the session setup screen
**When** they select "45 minutes" as the duration
**Then** the session timer is configured to count down from 45 minutes.
