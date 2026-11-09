# Your design system in Figma

How to build your own design system in Figma on top of UI Core Library: for designers, and for agents that work in the file.

IMPORTANT: Change the look through variables and modes, never on an instance. An instance of a library component takes variants, properties and content only.

## Your files

- **Foundations: a copy.** Duplicate [Core] Foundations and publish the copy as your library. It holds your colours, fonts, radii and sizes.
- **Components: no copy.** Enable [Core] UI Library in your files and use it as it is, so that its fixes and new components reach you. Build a component only your product needs in a library of your own, from Core components and the variables of your Foundations.
- **Icons: optional.** Use [Core] Icons, or publish a library of your own, as described under "Your own icons".

Keep the names of the collections, and of the variables in Themes, Surfaces, Sizes and Components: Swap library and the components match them by name. Primitives are yours to rename and extend, such as `brand/primary` to `brand/red`, because components never read them. Name the modes of Themes as the build reads them: `Light` and `Dark` for the base brand, `<Brand> Light` and `<Brand> Dark` for a further brand.

## Connect your Foundations

Use Figma's **Swap library**. Never rebind variables by hand or with a script.

1. Publish your copy of Foundations, then your icons, if you have them. Publish a library of your own components last, since it uses both.
2. In a working file, open the Libraries panel, choose [Core] Foundations, choose **Swap library** and pick your copy. Do the same for [Core] Icons if you have your own icons.
3. Select an instance of a Core component and switch a mode of Themes on its frame. It must take your values.

A variable bound by hand is an override. It stays on the instance when the variant changes, so a field switched to another size keeps the paddings of the old one.

When [Core] Foundations gains a variable, add it to your copy under the same name and publish. After accepting an update of a Core library, run Swap library again if anything still reads [Core] Foundations.

## Where a change belongs

Make a change on the first of these tiers that does what you want without affecting anything else.

1. **Primitives.** The colour ramps from 50 to 1000. Give the ramps your colours, keeping each one evenly stepped from light to dark. Name them as you like, such as `brand/red` instead of `brand/primary`, and add one for each further brand.
2. **Themes.** One mode for each brand and scheme. Point each role at a step of a ramp, and set the brand values: `font/heading`, `font/body`, `radius/*` and `text-uppercase/*`. A role has a value for every mode, so this is the place for anything that differs per theme.
3. **Surfaces.** The modes Default, Subtle, Inverse and Primary say what a frame stands on. Set the mode on a frame, and everything inside follows. Their values live in Themes, as `color/on-subtle/*`, `color/on-inverse/*` and `color/on-brand-primary/*`.
4. **Components.** The variables of one component, for a change to that component alone. The collection has a single mode, so a variable that must differ per theme points at a role of Themes or Surfaces. Never point it at a primitive: it would stop following the theme and the surface.

Before changing a role that is not specific to one component, find what else reads it. `color/background/sunken` is the background of filled fields and of other components too.

## Recipes

### Badge and selected Chip in the brand colour

They follow `action/primary` by default, so in a theme with a white primary button they are white too. In Components, point `color/badge/brand/solid/background` and `color/chip/selected/background` at `color/brand/primary/default`. Then check `color/badge/brand/solid/text`, `color/chip/selected/text` and `color/chip/selected/border` against the new background in every mode. Changing `action/primary` in Themes instead changes the buttons as well.

### Filled fields without a border

Point `color/control/filled/border/default` at `color/background/transparent`. Never hide the stroke on an instance.

### Another corner radius

Point `control/radius`, `chip/radius` or the radius of another component at a role of Themes: `radius/none`, `radius/sm`, `radius/md`, `radius/lg` or `radius/pill`. To get a value the roles do not have, change the primitive a role points at, and remember everything that reads it: `radius/lg` also rounds Popover, Dialog, Drawer and the panel of DateField.

### A field background that differs per theme

`color/control/filled/background/default` reads `color/background/sunken`, so it has one definition in Components and follows the surface. Put the frame that holds the field in a Surfaces mode, such as Subtle, and set `color/on-subtle/background/sunken` in Themes for every mode. For a translucent background, add a primitive with alpha. Everything else inside that frame that reads the sunken background changes too.

### Placeholder and field icon colours

The placeholder of a field reads `color/text/placeholder` and its icon reads `color/icon/muted`, so each changes on its own. Set them in Themes, or for one surface `color/on-subtle/text/placeholder` and `color/on-subtle/icon/muted`, and the same under `on-inverse` and `on-brand-primary`. Keep a contrast of at least 4.5:1 for the placeholder and 3:1 for the icon against the background of the field.

### A font without some weights

Set `font/heading` and `font/body`, then check the font has every weight the roles ask for. If it has no Medium, for example, point `typography/*/font-weight` and the `font-weight` variables of the components at a weight it has.

### Dashed borders

A variable cannot hold a dash pattern: only the colour and the width of a stroke can be bound. A dashed stroke is a setting on each instance, so repeat it on new instances and mention it in the handoff.

## Rules for instances

Do:

- Choose variants and set component properties.
- Write the content, and hide optional parts such as a label.
- Swap a nested icon for another icon of the library.
- Set how the instance sizes in its layout, such as filling the width.
- Set modes of Themes, Surfaces and Sizes on the frames around it.

Never:

- Bind another variable to a layer of an instance, even one that looks right.
- Type a colour, radius, spacing or font size on an instance.
- Hide a background or border to change the look.
- Detach an instance.

When an instance cannot look the way you need, change a variable using the tiers above, or ask for a new variant of the component.

An agent working through the Plugin API follows the same rules, and at the end compares the variable names bound on every layer of each instance with those of its main component, matching layers by name. They must be equal.

## Your own icons

1. Publish a library with one component per icon, named as in [Core] Icons (`icon/search`, `icon/close`), and every icon the components use, at 24 × 24.
2. Bind the colour of each icon to `color/icon/default` of your Foundations, never to a variable local to the icon file.
3. Connect the library with Swap library.

Draw every icon with fills, as [Core] Icons are: Core components set the colour of an icon on the fill of its vector. If your set uses strokes, use Outline stroke before publishing. A stroke does not take the colour of the component in Figma, and the build warns about it.

## Before handoff

- Every file reads your Foundations, and nothing still reads [Core] Foundations.
- Every screen looks right in every mode of Themes, and on every surface it uses.
- Text and placeholders keep a contrast of at least 4.5:1 in every mode.
- Instances follow the rules above. Any exception, such as a dashed stroke, is written down.
- No variable outside Primitives was renamed, and no variable of Components points at a primitive.
- Libraries are published in order: Foundations, icons, your components.
- Developers build the tokens from an export of your Foundations, as "Custom tokens and icons" in the documentation describes.
