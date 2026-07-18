# Ep-2: First-Time Setup

## Overview
The guided first-time versions of key user activities that also exist as general capabilities elsewhere. Onboarding walks a new user through picking a starter theme, a starter playlist, and creating their first task and session — so by the end of onboarding they've experienced the themed audio-visual environment and are ready to start focusing.

The underlying capabilities used here live in [cap-04-focus-experience](../../../../cap-04-focus-experience/index.md); this epic covers the *guided, first-time* invocation of them.

## Acceptance Criteria
- User picks a starter theme/environment before finishing onboarding
- User picks a starter playlist (or ambient sound) before finishing onboarding
- User creates at least one task during onboarding
- User configures their first session (duration + objective) during onboarding
- Each step can be skipped, but the defaults from [cap-01-platform-foundation](../../../../cap-01-platform-foundation/index.md) are used if skipped

## Given / When / Then

### Scenario 1: User selects a starter theme

**Given** a new user has reached the first-time setup portion of onboarding  
**When** they select a starter theme or skip the step  
**Then** the system shall save the selected theme or apply the default theme before continuing.

---

### Scenario 2: User selects a starter playlist

**Given** a new user has completed the theme selection step  
**When** they select a starter playlist or ambient sound, or skip the step  
**Then** the system shall save the selected audio or apply the default playlist before continuing.

---

### Scenario 3: User creates their first task

**Given** a new user has reached the task setup step during onboarding  
**When** they create a task or skip the step  
**Then** the system shall save the task if one is created or continue using the default behavior if skipped.

---

### Scenario 4: User configures their first focus session

**Given** a new user has completed the previous setup steps  
**When** they configure their first focus session and finish onboarding  
**Then** the system shall save the session configuration and redirect the user to their personalized dashboard.

---

### Scenario 5: User skips one or more setup steps

**Given** a new user is completing the first-time setup flow  
**When** they skip one or more setup steps  
**Then** the system shall apply the default values defined in [cap-01-platform-foundation](../../../../cap-01-platform-foundation/index.md) and allow onboarding to continue.

## Stories
- [story-01-choose-first-theme](stories/story-01-choose-first-theme.md)
- [story-02-choose-first-playlist](stories/story-02-choose-first-playlist.md)
- [story-03-set-up-first-task](stories/story-03-set-up-first-task.md)
- [story-04-set-up-first-session](stories/story-04-set-up-first-session.md)
