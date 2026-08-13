# Skill: Plan Work (Work Breakdown Hierarchy)

When planning, refining, or scoping work in this repository, decompose value into four nested levels: **Capability → Function → Epic → Story**. Each level has a specific shape and a specific level of detail.

The canonical instance of this hierarchy lives under [`docs/requirements/capabilities/`](../../docs/requirements/capabilities/README.md). New scope must fit somewhere in that tree.

---

## The four levels

### 1. Capability (top level)

A major area of value the product provides. Capabilities are stable over the lifetime of the product and rarely change.

- **Granularity:** entire problem area (e.g., "Focus Experience").
- **Detail level:** 1–3 sentences describing the value provided. No acceptance criteria, no scenarios, no implementation.
- **Owns:** a list of functions.
- **File:** `docs/requirements/capabilities/cap-XX-<slug>/index.md`.

### 2. Function

A coherent grouping of related epics inside a capability. Functions exist so that a large capability is navigable; they group epics by shared purpose or user activity.

- **Granularity:** one cohesive workflow within the capability (e.g., "Focus Session Flow").
- **Detail level:** 1–3 sentences describing what the function does and how it serves the capability. No acceptance criteria, no scenarios.
- **Owns:** a list of epics.
- **File:** `docs/requirements/capabilities/<cap>/functions/fn-XX-<slug>/index.md`.

### 3. Epic

A meaningful slice of user value — large enough to be motivating, small enough to be releasable in a few iterations. Phrased as a user story (`As a <persona>, I want to <do something>, so that <outcome>`).

- **Granularity:** a complete user-facing capability that delivers value end-to-end (e.g., "A member runs a timed focus session with music").
- **Detail level:**
  - The user-story sentence (persona / want / outcome)
  - 4–10 epic-level acceptance criteria (high-level "what must be true")
  - Optional: Given/When/Then scenarios at the epic level
  - No implementation detail; business language only
- **Owns:** a list of stories.
- **File:** `docs/requirements/capabilities/<cap>/functions/<fn>/epics/ep-N-<slug>/index.md`.

### 4. Story (smallest implementable unit)

A single, concrete, independently implementable change. Each story corresponds to **exactly one acceptance criterion** of its parent epic.

- **Granularity:** the smallest thing that can be built, tested, demoed, and released by itself. If a story takes more than a day or two of implementation, it is too big — split it.
- **Detail level:**
  - The single acceptance criterion it satisfies
  - The persona / want / so-that framing tied to that criterion
  - One or more Given/When/Then scenarios that make it executable
  - No design or implementation detail, but it must be testable as written
- **File:** `docs/requirements/capabilities/<cap>/functions/<fn>/epics/<ep>/stories/story-NN-<slug>.md`.

---

## Rules for stories

These rules are non-negotiable. Stories that violate them must be split or rewritten before work begins.

1. **One acceptance criterion per story.** If a story carries more than one AC, split it.
2. **Independent of every other story.** A story must be implementable, testable, demoable, and releasable on its own. It must not require another story to be completed first.
3. **No story-to-story dependencies.** If story A truly cannot ship without story B, then either:
   - merge them into a single story (they were really one unit), **or**
   - move the shared prerequisite into the parent epic's setup notes (so it isn't a story), **or**
   - re-scope story A to deliver value that doesn't need B.
4. **Vertical slice, not horizontal layer.** A story should cut through whatever is needed to deliver its single AC. "Add the data field" is not a story; "A member can name a playlist" is.
5. **Testable as written.** Every story has at least one Given/When/Then scenario that a tester (or automated test) could execute.
6. **Plain business language.** No technology names, file paths, or internal mechanics in story content — see `.claude/rules/always_enforce.md`. Implementation choices belong in the code, not the story.
7. **No redundant criteria.** A bullet that is already covered by an earlier bullet must be removed.
8. **Stable identifier.** Story IDs follow `S-<cap>.<epic>.<n>` and never change once issued.

## Choosing the order to do stories

Because stories are independent, the implementation order is chosen for **flow and feedback**, not dependencies.

Pick the next story by, in order:

1. **Highest user value first** — the story whose AC, on its own, is most useful to the user.
2. **Highest learning value second** — when value is similar, prefer the story that will teach the team the most about the problem (riskiest assumption, most unknown).
3. **Lowest cost as a tiebreaker** — between stories of similar value and learning, do the cheapest one first.

When ordering, never let "B is easier if A is done first" creep in. If that is true, the stories are not independent and must be re-scoped per the rules above.

## When adding new scope

1. Identify which **capability** the work belongs to. Create a new one only if no existing capability fits.
2. Identify or create the **function** within that capability.
3. Write the **epic** (user-story sentence + epic-level ACs).
4. Split the epic into **stories**, one per AC, each independent and testable.
5. Order the stories using the value/learning/cost rule above and start with the first one.

## When refining an existing epic

- If an epic's ACs cannot each become a standalone story, the epic is doing too much: split the epic, then re-derive the stories.
- If a proposed story turns out to depend on another, apply rule 3 above before writing any code.
