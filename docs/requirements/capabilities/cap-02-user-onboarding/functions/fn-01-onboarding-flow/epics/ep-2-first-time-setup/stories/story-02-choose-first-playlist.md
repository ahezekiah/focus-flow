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
**Given** a new user is in the onboarding flow
**When** they reach the audio selection step and pick "Rain"
**Then** rain sound is saved as their starter audio and previewed at the default volume.
