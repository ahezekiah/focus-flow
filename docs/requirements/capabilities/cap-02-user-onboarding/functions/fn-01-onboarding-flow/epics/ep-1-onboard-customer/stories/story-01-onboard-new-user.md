# Story-01: Onboard New User

## User Story
**As a** New User,
**I want** a brief guided registration
**so that** I understand FocusFlow's key features and can start my first session quickly.

## Acceptance Criteria
- Returning users who already finished registration are taken straight to their dashboard; new or unfinished users are guided through registration.
- New users can create an account by providing their details, with a clear, field-specific message shown if anything needs correcting.
- Registration introduces each key feature — Sessions, Projects, Tasks, Music, and Streaks — one step at a time, and asks the user to make a choice before moving to the next step.
- Users who finish registration are taken to their personalized dashboard; users who leave early pick up where they left off the next time they log in.

## Given / When / Then

### AC1: Returning vs. new users

#### Scenario 1: Returning user skips registration

* **Given** a user has already completed registration
* **When** they log in again
* **Then** the system shall take them directly to their dashboard.

---

#### Scenario 2: New or unfinished user sees registration

* **Given** a user has not completed registration, or is brand new
* **When** they log in
* **Then** the system shall present the guided registration flow.

---

### AC2: Creating an account

#### Scenario 3: User successfully creates an account

* **Given** a new user is on the registration screen
* **When** they enter their name, email, and password and submit
* **Then** the system shall create their account and continue into registration.

---

#### Scenario 4: User submits incomplete or invalid details

* **Given** a new user is on the registration screen
* **When** they submit details that are incomplete or don't meet the requirements (for example, an improperly formatted email, a password that's too weak, or an email already tied to an existing account)
* **Then** the system shall reject the submission and display a clear message next to the field that needs attention.

---

### AC3a: Sessions

#### Scenario 5: Sessions step explains the feature and asks for a choice

* **Given** a new user reaches the Sessions step of registration
* **When** the step appears
* **Then** the system shall explain what a session is and ask the user to choose their first session length or type.

---

#### Scenario 6: Sessions step holds the user until a choice is made

* **Given** a new user has not chosen a session length or type
* **When** they try to continue
* **Then** the system shall keep them on the Sessions step and prompt them to make a choice.

---

### AC3b: Projects

#### Scenario 7: Projects step explains the feature and asks for a choice

* **Given** a new user reaches the Projects step of registration
* **When** the step appears
* **Then** the system shall explain what a project is and ask the user to name their first project or pick a suggested template.

---

#### Scenario 8: Projects step holds the user until a choice is made

* **Given** a new user has not created or selected a project
* **When** they try to continue
* **Then** the system shall keep them on the Projects step and prompt them to make a choice.

---

### AC3c: Tasks

#### Scenario 9: Tasks step explains the feature and asks for an entry

* **Given** a new user reaches the Tasks step of registration
* **When** the step appears
* **Then** the system shall explain what a task is and ask the user to add their first task under the project they just created.

---

#### Scenario 10: Tasks step holds the user until an entry is made

* **Given** a new user has not entered a task
* **When** they try to continue
* **Then** the system shall keep them on the Tasks step and prompt them to complete it.

---

### AC3d: Music

#### Scenario 11: Music step explains the feature and asks for a choice

* **Given** a new user reaches the Music step of registration
* **When** the step appears
* **Then** the system shall explain the music feature (focus sounds and playlists) and ask the user to pick one option, including a "no music" choice.

---

#### Scenario 12: Music step holds the user until a choice is made

* **Given** a new user has not picked a music option
* **When** they try to continue
* **Then** the system shall keep them on the Music step and prompt them to make a choice.

---

### AC3e: Streaks

#### Scenario 13: Streaks step explains the feature and asks for a choice

* **Given** a new user reaches the Streaks step of registration
* **When** the step appears
* **Then** the system shall explain how streaks work and ask the user to set a daily goal or reminder time.

---

#### Scenario 14: Streaks step holds the user until a choice is made

* **Given** a new user has not set a streak preference
* **When** they try to continue
* **Then** the system shall keep them on the Streaks step and prompt them to make a choice.

---

### AC4: Finishing registration

#### Scenario 15: User completes registration

* **Given** a new user has completed every step of registration
* **When** they select "Done" or "Get Started" on the final step
* **Then** the system shall take them to their personalized dashboard.

---

#### Scenario 16: User leaves registration early

* **Given** a new user exits or abandons registration before finishing
* **When** they next log in
* **Then** the system shall bring them back to registration where they left off, rather than taking them to the dashboard.
