# Story-01: Choose First Theme

## User Story
**As a** New User in onboarding,
**I want** to pick a starter theme/environment
**so that** I leave onboarding with an immersive visual and ambient setting already applied to my sessions.

## Acceptance Criteria
- Onboarding presents the available default themes with previews
- User can select any theme, or skip and keep the platform default
- Chosen theme is applied to the user's account and used for subsequent sessions

The underlying user-facing theme selection is [story-01-choosing-a-theme-environment](../../../../../../cap-04-focus-experience/functions/fn-04-visual-environment/epics/ep-1-theme-selection/stories/story-01-choosing-a-theme-environment.md).

## Given / When / Then

### Scenario 1: User views available themes

* **Given** a new user has reached the theme selection step during onboarding  
* **When** the theme selection page is displayed  
* **Then** the system shall display the available default themes with previews.

---

### Scenario 2: User selects a theme

* **Given** a new user is on the theme selection step  
* **When** they select the "Forest" theme and click **Continue**  
* **Then** the system shall save the selected theme to the user's profile  
* **And** display the selected theme on the next onboarding screen.

---

### Scenario 3: User skips theme selection

* **Given** a new user is on the theme selection step  
* **When** they click **Skip**  
* **Then** the system shall apply the platform's default theme to the user's account  
* **And** continue to the next onboarding step.

---

### Scenario 4: Theme is applied to future sessions

* **Given** a user has completed onboarding with a selected theme  
* **When** they start a new focus session  
* **Then** the system shall automatically apply the saved theme to the session.
