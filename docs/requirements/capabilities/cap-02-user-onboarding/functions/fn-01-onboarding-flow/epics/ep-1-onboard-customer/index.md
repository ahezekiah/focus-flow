# Ep-1: Onboard Customer

## Epic-Level User Story
**As a** New User,
**I want** to be onboarded
**so that** I understand how to use FocusFlow and start my first session quickly.

## Acceptance Criteria
- New user can create an account in under a few minutes
- Onboarding introduces key features (sessions, tasks, playlist, theme)
- User reaches their personalized dashboard by the end of onboarding
- Onboarding can be skipped for returning/experienced users

The guided first-time selection of theme, playlist, task, and session lives in [ep-2-first-time-setup](../ep-2-first-time-setup/index.md).

## Given / When / Then

### Scenario 1: New user creates an account

* **Given** a visitor is on the registration page  
* **When** they successfully create an account  
* **Then** the system shall begin the onboarding process.

---

### Scenario 2: User is introduced to FocusFlow

* **Given** a new user has started onboarding  
* **When** they progress through the onboarding flow  
* **Then** the system shall introduce sessions, tasks, playlist, and theme before onboarding is completed.

---

### Scenario 3: User completes onboarding

* **Given** a new user has completed or skipped all onboarding steps  
* **When** they finish the onboarding flow  
* **Then** the system shall redirect them to their personalized dashboard.

---

### Scenario 4: Returning user logs in

* **Given** a user has previously completed onboarding  
* **When** they log in to FocusFlow  
* **Then** the system shall bypass the onboarding flow and display the personalized dashboard.

## Stories
- [story-01-onboard-new-user](stories/story-01-onboard-new-user.md)
