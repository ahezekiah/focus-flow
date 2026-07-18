# Story-01: Track longest streak

## User Story
**As a** User,
**I want** my longest streak to be saved
**so that** I can measure my progress over time

## Acceptance Criteria
- User's longest streak is tracked.
- Longest streak remains even if current streak resets

## Given / When / Then
**Given** a user acheieves their personal best,
**When** their current streak exceed their previous longest streak
**Then** then the longest streak is updated.

**Given** a user has their active current streak,
**When** the user misses a day their current streak is reset
**Then** their longest streak remains unchanged