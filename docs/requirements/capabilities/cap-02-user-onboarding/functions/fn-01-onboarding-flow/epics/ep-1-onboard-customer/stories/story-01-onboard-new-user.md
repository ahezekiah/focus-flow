# Story-01: Onboard New User

## User Story
**As a** New User,
**I want** a brief guided introduction after I register
**so that** I understand FocusFlow's key features and can start my first session quickly.

## Acceptance Criteria
- The system shall allow a new user to successfully create an account.
- The system shall introduce sessions, projects, tasks, music, and streaks during onboarding.
- The system shall redirect the user to their personalized dashboard after onboarding is completed.
- The system shall not display onboarding to users who have already completed it.

## Given / When / Then

### Scenario 1: User creates an account

**Given** a new user is on the registration page  
**When** they enter valid account information and submit the registration form  
**Then** the system shall create their account and begin the onboarding process.

---

### Scenario 2: User is introduced to core features

**Given** a new user has started onboarding  
**When** they progress through the onboarding screens  
**Then** the system shall introduce sessions, projects, tasks, music, and streaks before onboarding is completed.

---

### Scenario 3: User completes onboarding

**Given** a new user has completed or skipped all onboarding steps  
**When** they finish the onboarding flow  
**Then** the system shall redirect them to their personalized dashboard.

---

### Scenario 4: Returning user logs in

**Given** a user has previously completed onboarding  
**When** they log in to FocusFlow  
**Then** the system shall bypass the onboarding flow and display the personalized dashboard immediately.