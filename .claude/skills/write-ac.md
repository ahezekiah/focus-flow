# Skill: Write Acceptance Criteria

When asked to write or review acceptance criteria for any story file under `docs/requirements/capabilities/`, follow the process below to produce testable criteria and Given/When/Then scenarios.

The rules in `.claude/rules/always_enforce.md` govern these documents and take precedence over anything here.

---

## Core rules

1. Use business-domain terms only (focus session, break, playlist, audio file, theme, accountability partner, streak, reminder).
2. Describe WHAT outcome is expected — not HOW the system works.
3. Do not mention technology, internal mechanics, or anything that is not visible to the person using the product.
4. Each key example is a separate acceptance criterion.
5. Every acceptance criterion must have at least one Given/When/Then scenario.
6. Do not write a criterion that is already covered by an earlier criterion.
7. Prefer many clear scenarios over forcing unrelated cases into one scenario outline.
8. Include boundary and negative examples that clarify the rule.
9. Keep writing concise, accurate, understandable, and durable.

---

## Process

### 1. Identify scope
Summarize the business capability being specified in 1–3 sentences before writing anything else.

### 2. Derive business rules
List the explicit rules implied by the story. If something must be assumed, state it as an assumption — do not silently bake assumptions into criteria.

### 3. Write acceptance criteria
- Provide a list, one criterion per bullet.
- Make each criterion precise and testable.
- Avoid ambiguous words like *fast*, *proper*, or *user-friendly* unless made measurable (e.g., "within 300 ms", "fewer than 3 taps").
- Prefer observable outcomes — what the person using the product sees or gets.
- Exactly one business behavior per criterion; no compound rules.
- Remove any bullet that restates or is contained by another bullet.

### 4. Write Given/When/Then scenarios
Create one or more scenarios per criterion. Format each exactly as:

```
Scenario: <the criterion, restated as a short business-focused title>
**Given** <context — the starting state>
**When** <action or event>
**Then** <expected business outcome>
```

Rules:
- Every criterion gets its own scenario — no criterion may be left without one.
- Do not combine scenarios that represent different business rules.
- If multiple scenarios share the same Given/When structure but differ only in data, consolidate them into a scenario table (see step 5).
- Always include at least one negative or boundary scenario per criterion where applicable.

### 5. Consolidate where appropriate
If two or more scenarios share the same Given/When/Then structure and differ only in input values, replace them with a scenario table:

```
Scenario: <title>
**Given** <context>
**When** the member provides <input>
**Then** <outcome>

| Input         | Outcome          |
|---------------|------------------|
| <value 1>     | <result 1>       |
| <value 2>     | <result 2>       |
```

Do not consolidate scenarios that represent different business rules — keep those separate.

---

## Required output format

When writing acceptance criteria in response to a request, produce output in this order:

**Section 1 — Scope Summary**
One to three sentences describing the capability being specified.

**Section 2 — Business Rules**
Numbered list of explicit rules (plus any assumptions called out separately).

**Section 3 — Acceptance Criteria**
List; each item is a complete, testable statement.

**Section 4 — Given/When/Then Scenarios**
One or more scenarios per criterion, using the exact format above.

**Section 5 — Scenario Table (optional)**
Only when consolidation applies (step 5).

**Section 6 — Coverage Check**
Confirm:
- [ ] All criteria are testable
- [ ] At least one scenario exists per criterion
- [ ] Positive, negative, and boundary behaviors are represented
- [ ] No technical or internal language is present
- [ ] No duplicate or overlapping criteria, and no duplicate scenarios

---

## Story file format

When writing criteria directly into a story file under `docs/requirements/capabilities/`, use this structure:

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
**Given** <context>
**When** <action>
**Then** <outcome>

Scenario: <criterion 2, restated>
**Given** <context>
**When** <action>
**Then** <outcome>
```

See `.claude/prompt-snippets/story-format.md` for the surrounding directory structure.

---

## If inputs are incomplete

Ask up to 5 targeted clarification questions before writing the final acceptance criteria. Do not guess at scope.

---

## Quality gate before finalizing

- **Concise:** No unnecessary words.
- **Accurate:** Exactly one business behavior per criterion.
- **Understandable:** Clear to non-technical stakeholders.
- **Durable:** Stable even if the product's internals change.
