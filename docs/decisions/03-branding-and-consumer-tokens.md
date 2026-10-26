# Branding and consumer tokens

## Decision

### Three tiers

| Tier                       | What a consumer sets                                                                               | How                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1. Brand (required)        | the brand ramps, fonts, weights, radii, capitals on buttons, underlined links, focus-ring geometry | override on `:root`, or build from their own Figma export        |
| 2. Roles (optional)        | the mapping of colour roles, the typography scale, the density                                     | build from their own Figma export                                |
| 3. Components (exceptions) | any token of one component                                                                         | set the token on a selector that matches the component, or build |

- Tier 1 alone brands the whole library.
- A branding need is met by one of the tiers, never by a new semantic role.

### Runtime overrides

- Tokens that no mode changes, primitives and brand values, are declared once on `:root`. Overriding them there reaches every role and component.
- A token that changes with a mode is overridden on a selector that matches the components. It keeps following the theme and surface when its value points at a role.
- Component tokens are the only styling API ([07](07-styles.md)).

### The consumer's build

- A consumer duplicates [Core] Foundations, changes values and exports the variables with the same plugin.
- `ui-core-foundations build --input <dir> --output <dir> [--strict]` writes the same files as the library's build.
- Without `--strict`, layer and metadata rules are warnings. Pinning a component token to a primitive is listed as a token that no longer follows the mode.
- The command, its flags and its file names are public API from 1.0.0.
- A further brand is two Themes modes, `<Brand> Light` and `<Brand> Dark`, selected with `data-brand`. No variable is renamed.
- The CLI is tested on fixtures in the repository. Consumers test it on their own exports.

## Why

Most brands differ in a few colours and about twenty values. Branding should take minutes for them, while any component still stays reachable.

## Rejected

- Hooks named `--ui-<component>-<property>`: every value would get a second public name.
- One build per brand inside this repository: the library would hold its consumers' data.
