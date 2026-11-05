# Components

Every component has a specification in `shared`, a Stencil web component, a React component and one behaviour contract. [Decisions 05 to 08](../decisions/README.md) hold their rules, and the skills `ui-core-component`, `ui-core-stencil`, `ui-core-react`, `ui-core-testing` and `ui-core-docs` the details.

## Adding a component

The generator in `tools/generators` creates every file of a new component and registers it in the lists of the packages, the contracts and the site:

```sh
pnpm component:new IconButton --category Actions --figma 2041:17
```

- The name is PascalCase. `--category` takes the categories of the specification, and `--figma` the node of the component set, which adds the Code Connect templates.
- `--form` makes a form control: a form-associated web component, a React component around a native input, and contract cases for submitting, resetting and a disabled fieldset.
- The result is a minimal working component with status `in-progress`, and it passes `pnpm verify` as it is. `TODO(component)` marks every place that needs the component's own decisions: search for it and fill each one.
- A component with status `done` fails the tests of the generator while a `TODO(component)` is left in its files.

Then follow the order of the skill `ui-core-component` and the Definition of Done in [CONTRIBUTING.md](../../CONTRIBUTING.md#definition-of-done-a-component). Never create the files by hand, so that every component starts from the same structure.

## Changing a component

1. Change its specification in `packages/shared/src/components/<name>.ts` first, and run `pnpm shared:snapshot`. The web component stops compiling until it declares every prop of the specification, and the React props follow it by construction.
2. Change the web component in `packages/web-components/src/<name>/` and the React component in `packages/react/src/<name>/`, each with the tests of its package.
3. Change the contract in `testing/contracts/src/specs/<name>.contract.ts` for behaviour both share, and run `pnpm nx run contracts:test`.
4. Update the page and both story files in `apps/storybook/src/components/<category>/`, and the Code Connect templates beside the implementations.
5. Rebuild the guidelines of [Core] UI Library, as [the Figma guide](figma.md#updating-the-guidelines) describes.

## Fields with parsed values

NumberField and DateField keep the text a user types apart from the value they submit. Before changing either, read [the parsed fields guide](parsed-fields.md).

## Troubleshooting

- **A form reads stale data immediately after reset.** A web component's reset callback must restore its native input, `ElementInternals` form value and validity synchronously. Test `new FormData(form)` and form validation directly after `form.reset()`, without waiting for a render.
- **Radio options do not respond when modules load separately.** Test existing markup with RadioField loaded before RadioGroup. The group's first state update must connect already upgraded options to its channel; upgrading a parent does not reconnect its children.
- **Storybook shows old components.** It reads the built packages. Run `pnpm nx run-many -t build -p web-components react`.
- **A fresh clone of the web components does not build.** Stencil reads `src/components.d.ts`, which is committed; restore it from Git if it went missing.
