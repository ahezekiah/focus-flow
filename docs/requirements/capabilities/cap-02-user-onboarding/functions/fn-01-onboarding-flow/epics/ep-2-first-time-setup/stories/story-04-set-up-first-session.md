# Story-04: Set Up First Session

## User Story
**As a** New User in onboarding,
**I want** to configure my first focus session (duration + objective)
**so that** I finish onboarding with a session ready to start.

## Acceptance Criteria
- Onboarding offers duration choices (25/45/60/90 min or Custom) and objectives (Coding, Homework, Reading, Writing, Design, Research, or Custom)
- Session is linked to the task chosen in [story-03-set-up-first-task](story-03-set-up-first-task.md) if one exists
- Session is linked to the theme from [story-01-choose-first-theme](story-01-choose-first-theme.md) and audio from [story-02-choose-first-playlist](story-02-choose-first-playlist.md)
- Session record is created with userId, projectId, taskId, startedAt, durationMinutes, and objective

The underlying user-facing session setup is [story-01-set-up-a-session](../../../../../../cap-04-focus-experience/functions/fn-01-session-management/epics/ep-1-focus/stories/story-01-set-up-a-session.md).

## Given / When / Then
**Given** a new user has picked a theme, playlist, and task in onboarding
**When** they select "25 minutes" and "Coding" as the session objective
**Then** a session record is created with their onboarding choices applied and they land on the dashboard with a ready-to-start session.
