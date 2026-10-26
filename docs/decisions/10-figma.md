# Figma

## Decision

### Files and safety

- [Core] Foundations (`Xxn0guDvAfyIqEKB6kADE9`) holds the variables and styles. [Core] Icons (`lRdwn99eZTt6gCFeqc2Seh`) holds the icons. [Core] UI Library (`BzqkruN7r8mwWfFReznc83`) holds the components.
- The three files are refactored in place, never replaced. Experiments run on trial files in the team project.
- **Write protocol**: read the current state and dependencies, list the exact operations with before and after values, write them, and compare a control read with the plan.
- The approval of a step covers this protocol. Nothing is deleted before its bindings point elsewhere.
- The owner publishes the libraries and exports the variables with the Luckino plugin.

### Styles and documentation pages

- Text styles are the `ui-text-*` typography classes plus the Control styles.
- Effect styles are the shadows of code. There are no paint styles.
- The Foundations documentation pages are generated from `pages.json` and the live variables, rebuilt by the project skill `ui-core-figma`, and never edited by hand.

### Component sets

- **Names**: as in code. Properties have the names and values of the props.
- **Layers**: part layers carry the names of the parts.
- **Design-only properties**: `interaction` (`rest`, `active`, `focus`), and for TextField `valueState` (`empty`, `filled`). Any other needs a decision.
- **Bindings**: only the Components layer and the Foundations styles. The one exception is the focus-ring roles for the keyboard outline.
- **Page**: each component page holds a generated legend and the component set.

### Code Connect

- Every public component has a `.figma.ts` template next to each implementation. Both sets are checked by `pnpm figma:check` without a token, and React is the default publishing target.
- Snippets omit defaults, false booleans and empty optional text. Design-only properties never become props.
- The owner publishes after a dry run, and agents publish only in a step approved for publishing.

### Figma's AI features

| Feature                             | Use                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| MCP server with Code Connect        | Yes. Agents in consumer projects get the real components instead of generated markup. |
| Guidelines on the published library | Yes. Generated from the component pages, so they are written once.                    |
| Code sources                        | Later. Needs published packages and access to the beta.                               |
| Code layers, Specs                  | Not in the library. Consumer projects may use them for prototypes and briefs.         |
| Centralized design systems          | Watched until it leaves preview.                                                      |

## Why

Designers, developers and agents should see one name, one set of properties and one snippet per framework. Writing to shared files needs a protocol, because a broken binding fails silently.

## Rejected

- A snapshot of each component set in the repository: high upkeep, and the control read already catches drift.
- Specs as component documentation: Storybook stays the single source.
