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

### Scenario 1: User creates their first task

* **Given** a new user has reached the task setup step during onboarding  
* **When** they enter a task title and click **Continue**  
* **Then** the system shall save the task to the user's task list.

---

### Scenario 2: User attaches the task to a project

* **Given** a new user has created a task during onboarding  
* **When** they select an existing project or create a starter project  
* **Then** the system shall associate the task with the selected project.

---

### Scenario 3: User views the saved task

* **Given** a new user has completed task creation during onboarding  
* **When** they continue to the session setup step or finish onboarding  
* **Then** the created task shall be available in the user's task list.

---

### Scenario 4: User skips task creation

* **Given** a new user has reached the task setup step during onboarding  
* **When** they click **Skip**  
* **Then** the system shall continue to the next onboarding step without creating a task  
* **And** the user shall be able to create tasks later.
