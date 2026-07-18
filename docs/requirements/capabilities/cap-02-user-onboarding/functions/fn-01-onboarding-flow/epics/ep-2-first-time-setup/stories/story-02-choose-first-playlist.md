# Story-02: Choose First Playlist

## User Story
**As a** New User in onboarding,
**I want** to pick a starter playlist or ambient sound
**so that** I leave onboarding with music/sound already tuned for my first session.

## Acceptance Criteria
- Onboarding presents built-in playlists and individual ambient sounds with previews
- User can select any playlist/sound, or skip and keep the default playlist from [cap-01-platform-foundation](../../../../../../cap-01-platform-foundation/index.md)
- Volume can be adjusted during the preview
- Choice is saved to the user's profile

The underlying user-facing playlist selection is [story-02-choosing-a-playlist-or-sound](../../../../../../cap-04-focus-experience/functions/fn-03-audio-environment/epics/ep-1-audio-selection/stories/story-02-choosing-a-playlist-or-sound.md).

## Given / When / Then

### Scenario 1: User views available playlists and sounds

* **Given** a new user has reached the audio selection step during onboarding  
* **When** the audio selection page is displayed  
* **Then** the system shall display the available playlists and ambient sounds with previews.

---

### Scenario 2: User selects a playlist or ambient sound

* **Given** a new user is on the audio selection step  
* **When** they select the "Rain" ambient sound and click **Continue**  
* **Then** the system shall save the selected audio to the user's profile  
* **And** use it as the default audio for future focus sessions.

---

### Scenario 3: User adjusts the preview volume

* **Given** a new user is previewing a playlist or ambient sound  
* **When** they adjust the volume slider  
* **Then** the system shall update the preview volume without changing the saved system volume.

---

### Scenario 4: User skips audio selection

* **Given** a new user is on the audio selection step  
* **When** they click **Skip**  
* **Then** the system shall assign the platform's default playlist to the user's profile  
* **And** continue to the next onboarding step.
