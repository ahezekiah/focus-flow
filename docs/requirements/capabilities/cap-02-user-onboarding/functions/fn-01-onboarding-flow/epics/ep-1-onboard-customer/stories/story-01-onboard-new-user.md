# Story-01: Onboard New User

## User Story
**As a** New User,
**I want** a brief guided registration
**so that** I understand FocusFlow's key features and can start my first session quickly.

## Acceptance Criteria
- Returning users who already finished registration are taken straight to their dashboard; new or unfinished users are guided through registration.
- New users can create an account by providing their details, with a clear, field-specific message shown if anything needs correcting.
- Registration introduces each key feature — Sessions, Tasks, Playlist, and Theme — one step at a time, and asks the user to make a choice before moving to the next step.
- The Sessions step offers suggested session lengths and focus types, and lets the user enter their own instead.
- The Playlist step offers the playlists on hand along with a "No Playlist" choice.
- The Theme step offers the full set of looks, including Cafe, and the look the user picks is the one waiting for them once registration is finished.
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
* **Then** the system shall explain what a session is and ask the user for their first session length and focus type.

---

#### Scenario 6: User sets a session length and focus type of their own

* **Given** none of the suggested session lengths or focus types suit the user
* **When** they enter a session length and a focus type of their own
* **Then** the system shall accept what they entered and let them continue.

---

#### Scenario 7: Sessions step holds the user until a choice is made

* **Given** a new user has not chosen or entered a session length and focus type
* **When** they try to continue
* **Then** the system shall keep them on the Sessions step and prompt them to make a choice.

---

### AC3b: Tasks

#### Scenario 8: Tasks step explains the feature and asks for an entry

* **Given** a new user reaches the Tasks step of registration
* **When** the step appears
* **Then** the system shall explain what a task is and ask the user to add their first task.

---

#### Scenario 9: Tasks step holds the user until an entry is made

* **Given** a new user has not entered a task
* **When** they try to continue
* **Then** the system shall keep them on the Tasks step and prompt them to complete it.

---

### AC3c: Playlist

#### Scenario 10: Playlist step explains the feature and offers the playlists on hand

* **Given** a new user reaches the Playlist step of registration
* **When** the step appears
* **Then** the system shall explain what a playlist does for a session and display the playlists on hand together with a "No Playlist" choice.

---

#### Scenario 11: Playlist step holds the user until a choice is made

* **Given** a new user has not chosen a playlist
* **When** they try to continue
* **Then** the system shall keep them on the Playlist step and prompt them to make a choice.

---

#### Scenario 12: Choosing a playlist or none lets the user carry on

* **Given** the playlists on offer are displayed
* **When** the user picks one of them, or picks "No Playlist"
* **Then** the system shall let them continue to the next step.

---

### AC3d: Theme

#### Scenario 13: Theme step explains the feature and offers every look

* **Given** a new user reaches the Theme step of registration
* **When** the step appears
* **Then** the system shall explain what a theme changes and display every look on offer, Cafe among them.

---

#### Scenario 14: The look a user picks stays with them

* **Given** a new user has picked a look during registration
* **When** they finish registration and arrive at their dashboard
* **Then** the system shall dress the dashboard in the look they picked, and keep it on the next time they log in.

---

### AC4: Finishing registration

#### Scenario 15: User completes registration

* **Given** a new user has completed every step of registration
* **When** they select "Get Started" on the final step
* **Then** the system shall take them to their personalized dashboard.

---

#### Scenario 16: User leaves registration early

* **Given** a new user exits or abandons registration before finishing
* **When** they next log in
* **Then** the system shall bring them back to registration where they left off, rather than taking them to the dashboard.
