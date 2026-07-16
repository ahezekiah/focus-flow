# Story-03: Set Up First Task

## User Story
**As a** New User in onboarding,
**I want** to create my first task
**so that** I have a concrete work item lined up for my first focus session.

## Acceptance Criteria
- Onboarding prompts the user to create at least one task with a title
- User can optionally attach the task to a project (or create a lightweight starter project)
- Task is saved and available in the user's task list after onboarding
- Step is skippable — the user can create tasks later

The underlying user-facing task setup is [story-01-set-up-a-task](../../../../../../cap-04-focus-experience/functions/fn-02-task-management/epics/ep-1-task-tracking/stories/story-01-set-up-a-task.md).

## Given / When / Then
**Given** a new user has reached the task setup step in onboarding
**When** they enter a title like "Write onboarding notes" and confirm
**Then** the task is saved to their task list and shown in the session-setup step that follows.
