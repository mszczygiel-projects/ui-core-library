---
name: ui-core-decision
description: Use when recording or changing an architectural decision in UI Core Library - editing a file in docs/decisions, adding a new area, or checking which decision a rule belongs to.
---

# Recording a decision

Decisions are living documents in `docs/decisions/`, one file per area. Each describes the current state.

- **Find the area.** Edit the file whose area the decision belongs to, as listed in `docs/decisions/README.md`. Add a new file only for an area none of them covers: give it the next number, add it to the index, and keep the same sections.
- **Sections**:
  - `## Decision` holds the rules, grouped under `###` headings, in short bullets or tables.
  - `## Why` is a short paragraph.
  - `## Rejected` has one bullet per option: `Option: why not`.
- **Write the new state, not the change.** Rewrite the affected rule in place. Do not add "amended by" notes, dates or history; git keeps them. Remove any rule the decision replaces.
- **Keep it short.** About a page per file. Link to other decisions by number, such as `[05](05-components.md)`, and to code instead of repeating it.
- **Never describe where the rule came from.** No references to other repositories, earlier implementations or migration work.
- **Never decide silently.** A decision the owner has not approved is not recorded. Name the owner's choice when they chose between options.
- **Follow the rule everywhere.** Update `AGENTS.md`, `CONTRIBUTING.md`, the guides in `docs/guides/` and the project skills when the decision changes one of their rules.
- Run `pnpm exec prettier --write` on the changed files, which realigns tables.
