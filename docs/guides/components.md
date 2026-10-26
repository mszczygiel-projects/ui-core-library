# Components

Every component has a specification in `shared`, a Stencil web component, a React component and one behaviour contract. [Decisions 05 to 08](../decisions/README.md) hold their rules, and the skills `ui-core-component`, `ui-core-stencil`, `ui-core-react`, `ui-core-testing` and `ui-core-docs` the details.

## Changing a component

1. Change its specification in `packages/shared/src/components/<name>.ts` first, and run `pnpm shared:snapshot`. The web component stops compiling until it declares every prop of the specification, and the React props follow it by construction.
2. Change the web component in `packages/web-components/src/<name>/` and the React component in `packages/react/src/<name>/`, each with the tests of its package.
3. Change the contract in `testing/contracts/src/specs/<name>.contract.ts` for behaviour both share, and run `pnpm nx run contracts:test`.
4. Update the page and both story files in `apps/storybook/src/components/<category>/`, and the Code Connect templates beside the implementations.
5. Rebuild the guidelines of [Core] UI Library, as [the Figma guide](figma.md#updating-the-guidelines) describes.

A new component follows the order of the skill `ui-core-component` and the Definition of Done in [CONTRIBUTING.md](../../CONTRIBUTING.md#definition-of-done-a-component).

## Troubleshooting

- **Storybook shows old components.** It reads the built packages. Run `pnpm nx run-many -t build -p web-components react`.
- **A fresh clone of the web components does not build.** Stencil reads `src/components.d.ts`, which is committed; restore it from Git if it went missing.
