---
name: ui-core-step
description: Use when planning, implementing or finishing a step of UI Core Library - proposing its scope and decisions in Polish, branching, committing, verifying, documenting and opening the pull request. Use it also when the owner asks to start the next step or for a step proposal.
---

# A UI Core Library step

[CONTRIBUTING.md](../../../CONTRIBUTING.md) holds the way of working and the Definition of Done. This is the checklist.

## 1. Proposal, before any change

- Read the decisions the step touches and the code it builds on.
- Check every dependency the step adds:
  - its current version and release notes, and whether it is younger than a day, the minimum release age;
  - whether its makers publish official agent skills;
  - whether an existing, free tool already does what the step would write.
- Write the proposal in Polish, in the conversation, in plain language:
  - the scope;
  - every decision, with options and a recommendation;
  - new dependencies and why;
  - official skills;
  - risks;
  - what the step leaves out.
- A component proposal also covers the API of both implementations, the specification in `core`, the Figma and token changes, the labels, and the regressions its contract will cover.
- Wait for approval. It covers the agreed result and the corrections needed to reach it. A new decision, an extra effect on other components or an exception to a rule goes back to the owner as that difference alone. Continue with independent work meanwhile.

## 2. Branch

Create `step/<n>-<slug>` from an up-to-date `main`. Never commit on `main`.

## 3. Implementation

- Make small commits, one coherent change each, in Conventional Commits. The message says why and ends with the co-author trailer.
- New behaviour comes with tests next to the code. Make a new check fail once on a deliberate defect before trusting it.
- Record a decision by editing `docs/decisions` (skill `ui-core-decision`).
- Run `pnpm verify` before every commit, and never bypass the hooks. While editing, run the checks of the changed area. A passing check covers only the state it checked.

## 4. Figma, when the step changes it

Follow the write protocol of `docs/decisions/10-figma.md` and the skill `ui-core-figma`:

1. Read the state.
2. Prepare the dry run.
3. Write.
4. Do the control read.

Never delete before rebinding. The owner publishes libraries and exports variables.

## 5. Documentation

- Update what the step touches: decisions, Storybook pages, package READMEs, `CONTRIBUTING.md`, `AGENTS.md` and the project skills.
- Keep the repository self-contained. Before pushing, read the whole diff and the commit messages for references to other repositories, earlier implementations or migration work.

## 6. Pull request

- Push the branch and open the pull request with `gh pr create`.
- The title is in Conventional Commits, since the owner squashes it into one commit on `main`.
- The description covers what the step does, its decisions, how to check it and the open points.
- Wait for CI and the owner's review. Answer comments with new commits on the same branch. Never merge.
