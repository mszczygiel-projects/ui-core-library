---
name: ui-core-docs
description: Use when documenting a component of UI Core Library - its MDX page and its sections, the React and web component stories with their standard names, the blocks of the site, JSDoc, and the summary shared with Figma.
---

# Documenting a component

`docs/decisions/09-documentation.md` holds the rules. With the site running, read pages and preview stories through the `storybook` MCP server, and take Storybook's instructions for stories from it.

## The page

- `apps/storybook/src/components/<category>/<Name>.mdx`, with `<Meta title="Components/<Category>/<Name>/Docs" />`, imports both story files.
- Its sections, in order:
  1. Overview: `ComponentOverview`, with the summary of the specification and the links
  2. Usage
  3. Anatomy
  4. Variants & tone
  5. Sizes & density
  6. States
  7. Content & labels
  8. Behaviour
  9. Accessibility
  10. Surfaces & themes
  11. API: `FrameworkTabs` with `ReactApi` and `WebComponentApi`
  12. Tokens: `ComponentTokens`
  13. Implementation notes

  A section that does not apply says why.

- A part, whose specification has `partOf` (RadioField, AccordionItem, Tab), has no page and no stories. The page of its component describes it in its sections, shows its states in its own stories, and adds after its API a `### <Part>` heading with `FrameworkTabs`, `ReactApi` and `WebComponentApi` of the part. `stories.test.ts` checks both.
- The page shows only the `Variants` story, with `FrameworkCanvas`, for a component with a `variant`.
- Accessibility names the WAI-ARIA pattern, or says that none applies, and lists the keys.
- The manifest of Stencil does not list the form API of a control, such as `validity` or `checkValidity()`. The page describes it in prose.

## The stories

- `<Name>.react.stories.tsx`, titled `Components/<Category>/<Name>/React`, and `<Name>.wc.stories.tsx`, titled `…/Web Component`.
- Both files export exactly the stories of the specification, in its order. `src/components/stories.test.ts` checks it.
- Standard stories:
  - `Playground`;
  - `Variants`, for a component with a `variant`;
  - `With<Content>` for a slot that needs one, such as `WithIcons`;
  - `OnSurfaces`.

  The contracts test keys, forms and validation, so there are no test stories.

- Web component stories render the custom element as JSX, which React 19 sets as properties. Each element is typed in `src/components/web-components.d.ts`. Give the code panel the HTML through `parameters.docs.source` with `htmlOf`, and add the tag `!manifest`.
- Take the controls' options from the specification. An icon slot or prop gets a select of `iconOptions`; in React, `mapping` turns a name into its node.
- Use the decorator `onSurfaces` for a story on every surface. A play function checks what axe cannot, such as the contrast of a graphic with `expectGraphicContrast`.

## JSDoc and the summary

- Every component, prop, event, slot, part and token has a description.
- The summary is one sentence: the `summary` of the specification, the first sentence of the JSDoc of both implementations and the description of the Figma component.
