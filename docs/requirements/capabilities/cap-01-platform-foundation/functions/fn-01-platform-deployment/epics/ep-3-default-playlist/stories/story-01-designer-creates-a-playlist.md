# Story-01: Designer Creates a Playlist

## User Story

**As a** Designer,
**I want** to create a playlist
**so that** when the customer enters the experience they are interested and/or curious,
**and so that** when the customer begins a session, they have ambience to play.

## Acceptance Criteria

- A playlist is saved under the name the designer gives it
- A playlist holds only the audio files the designer chooses for it
- A customer who enters the experience hears the default playlist
- A playlist is available to play when a customer begins a session

## Given / When / Then

Scenario: A playlist is saved under the name the designer gives it
**Given** the designer has chosen the audio files for a new playlist
**When** they name the playlist "name 1"
**Then** the playlist is saved as "name 1".

Scenario: A playlist holds only the audio files the designer chooses for it
**Given** the system has audio files 1, 2 and 3
**When** the designer specifies audio files 1 and 2 to be in the playlist named "name 1"
**Then** the playlist "name 1" holds audio files 1 and 2
**And** audio file 3 is not in the playlist.

Scenario: A customer who enters the experience hears the default playlist
**Given** the default playlist holds audio files 1, 2 and 3
**When** a customer enters the experience
**Then** the default playlist plays audio files 1, 2 and 3.

Scenario: A playlist is available to play
**Given** a playlist has been created
**When** a customer plays a playlist
**Then** that playlist plays
