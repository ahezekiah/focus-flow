# Reference: Story File Format and Directory Structure

## Story file format

```markdown
# Story-NN: [Story Title]

## User Story

**As a** [role],
**I want** [action]
**so that** [outcome].

## Acceptance Criteria

- criterion 1
- criterion 2
- criterion 3

## Given / When / Then

Scenario: <criterion 1, restated>
**Given** <context — the starting state>
**When** <action or event>
**Then** <expected business outcome>

Scenario: <criterion 2, restated>
**Given** <context>
**When** <action>
**Then** <outcome>
```

Every bullet in `## Acceptance Criteria` must have its own scenario in `## Given / When / Then`. Do not
add a bullet that is already covered by an earlier bullet. Keep the wording plain and business-facing —
no technology names, no internal mechanics. See `.claude/skills/write-ac.md` for the full process and
`.claude/rules/always_enforce.md` for the rules these documents must satisfy.

A story may also carry a `## UI Mockup` section with screen sketches or images, placed after the scenarios.

## Directory structure

```
docs/requirements/capabilities/
  README.md                              ← capability index
  cap-XX-slug/
    index.md                             ← capability nav-hub
    functions/
      fn-XX-slug/
        index.md                         ← function nav-hub (breadcrumb → capability)
        epics/
          ep-N-slug/
            index.md                     ← epic (user story + epic-level AC + stories table)
            stories/
              story-NN-slug.md           ← individual story file
```
