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

### Scenario 1: User configures their first focus session

**Given** a new user has reached the session setup step during onboarding  
**When** they select a session duration and objective and click **Finish Setup**  
**Then** the system shall create a focus session using the selected settings.

---

### Scenario 2: Session is linked to the selected task

**Given** a new user created a task during onboarding  
**When** they complete the session setup step  
**Then** the system shall associate the focus session with the selected task.

---

### Scenario 3: Session uses the selected theme and audio

**Given** a new user selected a theme and playlist during onboarding  
**When** they complete the session setup step  
**Then** the system shall associate the focus session with the selected theme and audio settings.

---

### Scenario 4: Session record is created

**Given** a new user has completed the session setup step  
**When** the system saves the focus session  
**Then** the session record shall include the user's ID, project ID (if applicable), task ID (if applicable), start time, session duration, and selected objective.
