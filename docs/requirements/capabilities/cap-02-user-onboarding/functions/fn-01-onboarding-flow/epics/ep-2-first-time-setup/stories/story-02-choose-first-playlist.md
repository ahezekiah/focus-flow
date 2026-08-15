# Story-02: Choose Playlist for Session

## User Story

**As a** New User in onboarding,
**I want** to pick a starter playlist or ambient sound
**so that** I leave onboarding with music/sound already tuned for my first session.

## Acceptance Criteria

- Onboarding presents built-in playlists and individual ambient sounds with previews
- User can select any playlist/sound, or skip and keep the default playlist from [cap-01-platform-foundation](../../../../../../cap-01-platform-foundation/index.md)
- The playlist or sound chosen here is the one that plays during the user's focus sessions
- Volume can be adjusted during the preview

The underlying user-facing playlist selection is [story-02-choosing-a-playlist-or-sound](../../../../../../cap-04-focus-experience/functions/fn-03-audio-environment/epics/ep-1-audio-selection/stories/story-02-choosing-a-playlist-or-sound.md).

## Given / When / Then

### Scenario 1: User views the playlists and sounds on offer

*Covers: onboarding presents built-in playlists and individual ambient sounds with previews.*

* **Given** a new user has reached the audio selection step during onboarding
* **When** the step opens
* **Then** the built-in playlists and the individual ambient sounds are both listed
* **And** each one can be previewed before it is chosen.

---

### Scenario 2: User selects a playlist or ambient sound

*Covers: user can select any playlist or sound.*

* **Given** a new user is on the audio selection step
* **When** they select the "Rain" ambient sound and continue
* **Then** "Rain" is recorded as their chosen audio
* **And** onboarding continues to the next step.

---

### Scenario 3: User skips audio selection

*Covers: user can skip and keep the default playlist.*

* **Given** a new user is on the audio selection step
* **When** they skip without choosing anything
* **Then** the default playlist is recorded as their chosen audio
* **And** onboarding continues to the next step.

---

### Scenario 4: The chosen audio is used for the user's focus sessions

*Covers: the playlist or sound chosen here is the one that plays during focus sessions.*

* **Given** a new user has finished the audio selection step, whether by choosing or by skipping
* **When** they set up their first focus session
* **Then** the audio recorded during onboarding is already chosen for that session
* **And** it plays when the session begins.

---

### Scenario 5: User adjusts the volume while previewing

*Covers: volume can be adjusted during the preview.*

* **Given** a new user is previewing a playlist or ambient sound
* **When** they raise or lower the volume
* **Then** the preview immediately plays at the new volume
* **And** the volume they hear in their focus sessions is left unchanged.
