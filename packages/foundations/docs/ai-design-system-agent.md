# AI Design System Agent — Guide

> This document is the **complete, self-contained guide** for an AI agent creating a client design system based on the [Core] Foundations variable structure.
> No other context is required to complete the task.

---

## 1. Mission

You are an AI design system agent. Your job is to create a complete, brand-specific design system for a client by **updating the Figma Variable values** in the client's forked [Core] Foundations file.

The fork already contains all required Variable collections, modes, and variable names — you never create or delete variables. You only update their values.

**Expected output:** All Figma Variables updated via `use_figma` (Plugin API) to reflect the client's brand.

**After you're done:** The user will manually export the Variables via Luckino → 4 JSON files → `pnpm foundations:build` → CSS/TS tokens.

---

## 2. What You Receive from the User

Before starting, you should have the following brand inputs. If any are missing, ask for them:

| Input                       | Required | Notes                                                                 |
| --------------------------- | -------- | --------------------------------------------------------------------- |
| Primary brand color (hex)   | ✅       | Main brand color — used for buttons, links, key UI elements           |
| Secondary brand color (hex) | ✅       | Accent color — used for highlights, badges                            |
| Logo / visual assets        | Optional | Helps understand brand personality                                    |
| Target audience             | ✅       | B2B enterprise / B2C consumer / prosumer / internal tool              |
| Brand personality words     | ✅       | e.g. "trustworthy, innovative, warm, premium, energetic"              |
| Visual references           | Optional | Links to products the client likes or wants to avoid                  |
| Font preference             | Ask      | If unspecified — ask: serif, sans-serif, or monospace? Specific font? |
| Corner rounding             | Ask      | Sharp (enterprise) / rounded (consumer)? Or no preference?            |
| Button text uppercase       | Ask      | Yes / No?                                                             |

---

## 3. Token Architecture

There are **5 Variable collections** in the fork. They form a strict reference chain:

```
┌─────────────────────────────────────────────────────────┐
│  Primitives Colors     Primitives Sizes                 │ ← raw values
│  Primitives Motions    Primitives Shadows               │
└──────────────┬──────────────────────────────────────────┘
               │ referenced by
┌──────────────▼──────────────────────────────────────────┐
│  Themes  (modes: Default | Dark)                        │ ← semantic aliases
└──────────────┬──────────────────────────────────────────┘
               │ referenced by
┌──────────────▼──────────────────────────────────────────┐
│  Surfaces  (modes: Default | Subtle | Inverse | Primary)│ ← surface aliases
│  Sizes     (modes: Mobile | Desktop)                    │ ← responsive aliases
└─────────────────────────────────────────────────────────┘
```

**Rules:**

- Each layer may only reference the layer directly above it — never skip layers, never reference downward
- Surfaces variables are almost always already correct (they reference Themes). You rarely need to touch them
- **You primarily update: Primitives Colors** (raw values) **+ Themes** (which Primitive each token maps to)

---

## 4. Workflow — Step by Step

### Step 1: Gather brand inputs

Ask for any missing inputs listed in Section 2. Do not proceed without at least the primary color and brand personality context.

### Step 2: Classify the design character

Based on answers + visual assets, classify into one of these archetypes:

| Archetype                     | Traits                                 | Token implications                                                                               |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Enterprise / Professional** | B2B, "trusted, reliable, efficient"    | Muted brand colors, radius `sm`–`md`, tight spacing, normal/medium weights, no uppercase buttons |
| **Consumer / Playful**        | B2C, "friendly, fun, accessible"       | Vibrant brand colors, radius `lg`–`xl`, generous spacing, medium/semibold weights                |
| **Minimal / Luxury**          | Premium, "elegant, exclusive, refined" | Restrained palette (single brand hue), `none`–`sm` radius, max whitespace, thin/light weights    |
| **Bold / Dynamic**            | "Energetic, confident, impactful"      | High-contrast brand colors, `md`–`xl` radius, semibold/bold weights, uppercase buttons often     |

This archetype drives decisions in Steps 4–7.

### Step 3: Create a design preview in Figma and get approval ⭐

**Before generating any token values, create a visual proposal in Figma** so the client can review the direction. This prevents rework — it's much faster to adjust a preview than to redo all tokens.

#### What to create

Create a new page in the Figma file called **`Design Preview`** with three sections:

1. **Color Palette** — swatches of proposed colors (brand.primary, brand.secondary, gray, semantic colors)
2. **Typography Scale** — text samples in the proposed font at all heading and body sizes
3. **UI Sample** — a small mockup showing how the brand looks in a real interface context (web + mobile)

#### Figma script structure

Use raw hex values (not Variables) for the preview — this is a proposal, not the final system.

**Section 1 — Color palette:**

```js
// Create a 'Design Preview' page
const previewPage = figma.createPage();
previewPage.name = 'Design Preview';
await figma.setCurrentPageAsync(previewPage);

// Position new content away from 0,0
let xOffset = 40;

// --- COLOR PALETTE SECTION ---
const paletteFrame = figma.createAutoLayout('VERTICAL', {
  name: 'Color Palette',
  x: xOffset,
  y: 40,
  itemSpacing: 16,
  paddingTop: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  paddingRight: 24,
  fills: [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }],
  cornerRadius: 8,
});

// Section title
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
const paletteTitle = figma.createText();
paletteTitle.characters = 'Color Palette';
paletteTitle.fontName = { family: 'Inter', style: 'Semi Bold' };
paletteTitle.fontSize = 20;
paletteFrame.appendChild(paletteTitle);

// Helper: create a row of color swatches for a palette
async function createSwatchRow(parent, label, shades) {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const row = figma.createAutoLayout('HORIZONTAL', { name: label, itemSpacing: 4 });

  // Label
  const labelText = figma.createText();
  labelText.characters = label.padEnd(20);
  labelText.fontName = { family: 'Inter', style: 'Regular' };
  labelText.fontSize = 12;
  labelText.set({ width: 120 });
  row.appendChild(labelText);

  // Swatches
  for (const [name, hex] of Object.entries(shades)) {
    const swatch = figma.createFrame();
    swatch.set({ name, width: 48, height: 48, cornerRadius: 4 });
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    swatch.fills = [{ type: 'SOLID', color: { r, g, b } }];

    // Shade label below swatch
    const shadeLabel = figma.createText();
    shadeLabel.characters = name;
    shadeLabel.fontName = { family: 'Inter', style: 'Regular' };
    shadeLabel.fontSize = 9;

    const swatchCol = figma.createAutoLayout('VERTICAL', { name, itemSpacing: 4 });
    swatchCol.appendChild(swatch);
    swatchCol.appendChild(shadeLabel);
    row.appendChild(swatchCol);
  }
  parent.appendChild(row);
}

// Fill in the actual proposed colors here:
const brandPrimaryProposal = {
  100: '#…',
  200: '#…',
  300: '#…',
  400: '#…',
  500: '#…',
  600: '#…',
  700: '#…',
};
const brandSecondaryProposal = {
  /* same */
};
const grayProposal = {
  50: '#…',
  100: '#…',
  200: '#…',
  300: '#…',
  400: '#…',
  500: '#…',
  600: '#…',
  700: '#…',
  800: '#…',
  900: '#…',
  1000: '#…',
};

await createSwatchRow(paletteFrame, 'brand.primary', brandPrimaryProposal);
await createSwatchRow(paletteFrame, 'brand.secondary', brandSecondaryProposal);
await createSwatchRow(paletteFrame, 'gray', grayProposal);

return { paletteFrameId: paletteFrame.id };
```

**Section 2 — Typography scale:**

```js
// Run after Section 1 script, position to the right
const typographyFrame = figma.createAutoLayout('VERTICAL', {
  name: 'Typography',
  x: xOffset + paletteWidth + 40,
  y: 40,
  itemSpacing: 8,
  paddingTop: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  paddingRight: 24,
  fills: [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }],
  cornerRadius: 8,
});

// Load all font weights you'll use
await figma.loadFontAsync({ family: 'YourFont', style: 'Regular' });
await figma.loadFontAsync({ family: 'YourFont', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'YourFont', style: 'Bold' });

const typeSamples = [
  { label: 'Display', size: 48, weight: 'Regular', text: 'Display Heading' },
  { label: 'H1', size: 36, weight: 'Semi Bold', text: 'Heading 1 — Main Title' },
  { label: 'H2', size: 30, weight: 'Semi Bold', text: 'Heading 2 — Section Title' },
  { label: 'H3', size: 24, weight: 'Semi Bold', text: 'Heading 3 — Subsection' },
  { label: 'H4', size: 20, weight: 'Semi Bold', text: 'Heading 4' },
  { label: 'H5', size: 18, weight: 'Semi Bold', text: 'Heading 5' },
  { label: 'H6', size: 16, weight: 'Semi Bold', text: 'Heading 6' },
  { label: 'Body', size: 16, weight: 'Regular', text: 'Body text — regular paragraph content' },
  { label: 'Body Sm', size: 14, weight: 'Regular', text: 'Small body text — secondary content' },
  { label: 'Caption', size: 12, weight: 'Regular', text: 'Caption text — labels, annotations' },
  { label: 'Eyebrow', size: 12, weight: 'Semi Bold', text: 'EYEBROW LABEL' },
];

for (const { label, size, weight, text } of typeSamples) {
  const row = figma.createAutoLayout('HORIZONTAL', { itemSpacing: 16 });

  const labelNode = figma.createText();
  labelNode.characters = label.padEnd(10);
  labelNode.fontName = { family: 'Inter', style: 'Regular' };
  labelNode.fontSize = 11;
  labelNode.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
  labelNode.set({ width: 80 });
  row.appendChild(labelNode);

  const sample = figma.createText();
  sample.characters = text;
  sample.fontName = { family: 'YourFont', style: weight };
  sample.fontSize = size;
  row.appendChild(sample);

  typographyFrame.appendChild(row);
}
```

**Section 3 — UI Sample (web + mobile):**

Create a simplified but realistic UI mockup. It should include:

- **Header bar** with logo placeholder + nav links + primary button
- **Hero section** with headline, subline, and CTA button
- **Feature card row** with 2–3 cards (icon, title, body text)
- **Form section** with an input field + submit button
- A **mobile frame** (375px wide) mirroring the same sections

Use the proposed brand colors for fills (raw hex, not Variables). Show both Light mode and, optionally, a simplified Dark mode strip at the bottom.

```js
// Web frame
const webFrame = figma.createFrame();
webFrame.set({ name: 'Web Preview', width: 1280, height: 900 });
webFrame.x = xOffset;
webFrame.y = paletteFrameBottom + 60;

// Background
webFrame.fills = [{ type: 'SOLID', color: hexToRGB('#FFFFFF') }];

// Header bar
const header = figma.createAutoLayout('HORIZONTAL', {
  name: 'Header',
  width: 1280,
  height: 64,
  primaryAxisSizingMode: 'FIXED',
  counterAxisSizingMode: 'FIXED',
  paddingLeft: 40,
  paddingRight: 40,
  itemSpacing: 0,
  counterAxisAlignItems: 'CENTER',
  fills: [{ type: 'SOLID', color: hexToRGB('#FFFFFF') }],
});

// Logo placeholder
const logo = figma.createRectangle();
logo.set({ name: 'Logo', width: 120, height: 32, cornerRadius: 4 });
logo.fills = [{ type: 'SOLID', color: hexToRGB(brandPrimary500) }];
header.appendChild(logo);

// Spacer
const spacer = figma.createFrame();
spacer.set({ name: 'spacer', width: 1, height: 1 });
spacer.layoutGrow = 1;
header.appendChild(spacer);

// Primary CTA button
const btn = figma.createAutoLayout('HORIZONTAL', {
  name: 'Button Primary',
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: buttonRadius, // from archetype
  fills: [{ type: 'SOLID', color: hexToRGB(brandPrimary500) }],
  itemSpacing: 8,
});
await figma.loadFontAsync({ family: 'YourFont', style: 'Semi Bold' });
const btnText = figma.createText();
btnText.characters = 'Get Started';
btnText.fontName = { family: 'YourFont', style: 'Semi Bold' };
btnText.fontSize = 14;
btnText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
btn.appendChild(btnText);
header.appendChild(btn);

webFrame.appendChild(header);

// … continue with Hero, Cards, Form
// Return all created node IDs for reference in next steps
return { webFrameId: webFrame.id };
```

#### After creating the preview

Take a screenshot using `await frame.screenshot()` and present it to the user. Ask:

> "Here is the proposed design direction based on your brand inputs. Does this palette, typography, and visual style feel right? Let me know:
>
> - Any color adjustments (too saturated? too dark? different undertone?)
> - Typography feedback (font choice, weight, scale feel)
> - Overall vibe — does it match your brand personality?"

**Only proceed to Step 4 after the client approves the direction.** Iterate on the preview (re-run the preview scripts with updated values) until the direction is confirmed.

### Step 4: Generate the Primitives Colors palette

This is the most important step. You generate raw color values for every primitive.

**Brand palette (brand.primary.100–700):**

Given the client's primary brand color (hex), generate a 7-step scale:

- 100: ~95% lightness — very pale tint (backgrounds, subtle fills)
- 200: ~90% lightness
- 300: ~80% lightness — light tint (hover backgrounds)
- 400: ~65% lightness — mid-light (light mode accents)
- 500: The base brand color itself (or closest shade used in Light mode)
- 600: ~40% darker — used for hover states, Dark mode primary
- 700: ~60% darker — deep shade (text on light, dark accents)

Use HSL manipulation: keep Hue constant, vary Lightness (and optionally slightly adjust Saturation for visual quality). For warm brands, increase Saturation slightly at mid-tones. For cool/minimal brands, reduce Saturation at extremes.

Same logic for `brand.secondary.100–700`.

**Gray scale (gray.50–1000):**

Determine the gray undertone from the brand primary:

- Warm brand (red/orange/yellow hue) → warm gray (slight yellow/beige undertone, e.g. HSL with 30–45° hue)
- Cool brand (blue/purple hue) → cool gray (slight blue undertone, e.g. HSL with 220–240° hue)
- Neutral brand → pure neutral gray (0° or 220° hue, low saturation)

Scale: 50 (near-white) → 100 → 200 → 300 → 400 → 500 → 600 → 700 → 800 → 900 → 1000 (near-black)

**Semantic scales (green, red, blue, orange) — 50–1000:**

These are used for feedback colors (success, error, info, warning). Use standard web-safe scales slightly adjusted to harmonize with the brand undertone. Don't deviate too far from recognizable green/red/blue/orange — these carry universal meaning.

**Black and white (opacity scales):** These are always fixed — do not change them.

```
black.100 = rgba(12, 12, 13, 0.05)    white.100 = rgba(255, 255, 255, 0.05)
black.200 = rgba(12, 12, 13, 0.10)    white.200 = rgba(255, 255, 255, 0.10)
black.300 = rgba(12, 12, 13, 0.20)    white.300 = rgba(255, 255, 255, 0.20)
black.400 = rgba(12, 12, 13, 0.40)    white.400 = rgba(255, 255, 255, 0.40)
black.500 = rgba(12, 12, 13, 0.70)    white.500 = rgba(255, 255, 255, 0.70)
black.600 = rgba(12, 12, 13, 0.80)    white.600 = rgba(255, 255, 255, 0.80)
black.700 = rgba(12, 12, 13, 0.85)    white.700 = rgba(255, 255, 255, 0.85)
black.800 = rgba(12, 12, 13, 0.90)    white.800 = rgba(255, 255, 255, 0.90)
black.900 = rgba(12, 12, 13, 0.95)    white.900 = rgba(255, 255, 255, 0.95)
black.1000 = #0c0c0d                  white.1000 = #ffffff
```

**Transparent:** always `rgba(255, 255, 255, 0)` — do not change.

**Primitives Motions, Primitives Sizes, Primitives Shadows:** These are universal constants. Do not change unless the brand specifically requires custom animation timing or shadow intensity.

### Step 5: Plan the Themes semantic mapping

For each Theme variable, decide which Primitive it should reference, for both Default (Light) and Dark modes.

The mapping table below shows the default Core Foundation references. Review each one and adjust to fit the brand:

**color/brand/** — these almost always stay as-is (pointing to `brand.primary.*` and `brand.secondary.*`). Only adjust which shade (e.g. use `.400` instead of `.500` for a lighter-feeling brand).

**color/background/default:**

- Light: `white.1000` (standard) or `gray.50` (slightly warm)
- Dark: `gray.900` (standard) — adjust if brand prefers a different dark shade

**color/background/sunken** (input/form backgrounds):

- Light: `gray.100` or `gray.50`
- Dark: `gray.800`

**color/text/primary:**

- Light: `gray.1000` — do not make lighter than `gray.800`
- Dark: `gray.50`

**color/feedback/success/base → green.800** (or similar accessible green shade)
**color/feedback/error/base → red.800** (or similar)
**color/feedback/info/base → blue.800`**
**color/feedback/warning/base → orange.800`**

For detailed reference of all 1348 Theme variable mappings, see [token-schema-reference.md](./token-schema-reference.md).

### Step 6: Check accessibility

Before writing to Figma, verify these contrasts:

| Pair                                                 | Minimum ratio                     |
| ---------------------------------------------------- | --------------------------------- |
| `color/text/primary` on `color/background/default`   | 4.5:1 (AA)                        |
| `color/text/secondary` on `color/background/default` | 4.5:1 (AA)                        |
| Button primary text on button primary background     | 4.5:1 (AA)                        |
| `color/text/brand` on `color/background/default`     | 4.5:1 (AA) — especially important |
| Large text / headings (18px+)                        | 3:1 minimum                       |

Use WCAG contrast formula: `(L1 + 0.05) / (L2 + 0.05)` where L is relative luminance.

If a brand color doesn't pass (e.g. yellow brand primary as text), do not use it directly as text — use a darker shade (e.g. `.700`) for text, keep `.500` for backgrounds/accents only.

### Step 7: Write Primitives Colors to Figma

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();

const primColorsColl = collections.find((c) => c.name === 'Primitives Colors');
const modeId = primColorsColl.modes[0].modeId; // single mode

// Helper: hex to Figma RGB (0–1 range)
function hexToFigmaRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

// Helper: rgba string to Figma RGBA
function rgbaToFigmaRGBA(rgbaStr) {
  const [r, g, b, a] = rgbaStr.match(/[\d.]+/g).map(Number);
  return { r: r / 255, g: g / 255, b: b / 255, a };
}

// Set brand primary palette
const brandPrimary = {
  100: '#dde3fd',
  200: '#a8bafa',
  // ... all 7 shades
};

for (const [shade, hex] of Object.entries(brandPrimary)) {
  const v = allVars.find((v) => v.name === `brand/primary/${shade}`);
  if (v) v.setValueForMode(modeId, hexToFigmaRGB(hex));
}

return { status: 'Primitives Colors updated' };
```

Work in batches per palette group (brand.primary, brand.secondary, gray, green, red, blue, orange) — one `use_figma` call per group to stay within the 10-operation guideline.

### Step 8: Write Themes aliases to Figma

Themes variables are **aliases** — they point to Primitives variables. You update which Primitive each Theme token references.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();

const themesColl = collections.find((c) => c.name === 'Themes');
const defaultModeId = themesColl.modes.find((m) => m.name === 'Default').modeId;
const darkModeId = themesColl.modes.find((m) => m.name === 'Dark').modeId;

// Helper to find a variable by name
const findVar = (name) => allVars.find((v) => v.name === name);

// Example: update color/brand/primary to point to brand/primary/500 (Light) and brand/primary/400 (Dark)
const brandPrimaryTheme = findVar('color/brand/primary');
const prim500 = findVar('brand/primary/500');
const prim400 = findVar('brand/primary/400');

brandPrimaryTheme.setValueForMode(defaultModeId, figma.variables.createVariableAlias(prim500));
brandPrimaryTheme.setValueForMode(darkModeId, figma.variables.createVariableAlias(prim400));

return { status: 'Themes aliases updated' };
```

**Important:** The variable name in Figma uses `/` as path separator. Find variables by exact name match.

### Step 9: Handle Sizes (typography + component sizing)

**Typography font families:** Update `typography/heading/font-family`, `typography/body/font-family`, `typography/caption/font-family`, `typography/eyebrow/font-familly` (note typo in original) to the client's chosen font.

**Button uppercase:** Set `button/text-transform/uppercase` to `true` or `false` based on client preference.

**Radius:** For the Sizes collection, `radius/sm`, `radius/md`, `radius/lg`, `radius/pill` values determine component rounding. Adjust based on archetype:

- Enterprise: sm=2, md=4, lg=6, pill=9999
- Consumer: sm=4, md=8, lg=12, pill=9999
- Minimal: sm=0, md=2, lg=4, pill=9999

Typography scale (heading sizes, body sizes, etc.) should not be changed unless the client has a very specific size ramp requirement. The Core Foundation scale is well-balanced and works for most use cases.

### Step 10: Validate and screenshot

After all updates, take a screenshot to verify the output:

```js
// Quick validation script
const allVars = await figma.variables.getLocalVariablesAsync();
const missing = allVars.filter(v => {
  // Check if any variable has no value set
  const coll = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  return coll.modes.some(m => {
    const val = v.valuesByMode[m.modeId];
    return val === undefined || val === null;
  });
});
return { missingCount: missing.length, missing: missing.map(v => v.name).slice(0, 20) };
```

Also verify key contrasts visually once the client views the updated file in Figma.

---

## 5. Key Semantic Mapping Rules (Themes)

This table shows the default mapping in Core Foundation. Adjust to fit the brand.

### color/brand/\*

| Variable                | Light Mode → Primitive | Dark Mode → Primitive |
| ----------------------- | ---------------------- | --------------------- |
| `color/brand/primary`   | `brand/primary/500`    | `brand/primary/400`   |
| `color/brand/secondary` | `brand/secondary/400`  | `brand/secondary/400` |
| `color/brand/tertiary`  | `gray/200`             | `gray/200`            |

### color/background/\*

| Variable                         | Light                   | Dark                    |
| -------------------------------- | ----------------------- | ----------------------- |
| `color/background/default`       | `white/1000`            | `gray/900`              |
| `color/background/sunken`        | `gray/100`              | `gray/800`              |
| `color/background/subtle`        | `gray/200`              | `gray/700`              |
| `color/background/inverse`       | `gray/900`              | `white/1000`            |
| `color/background/overlay`       | `black/100`             | `black/100`             |
| `color/background/brand-primary` | `→ color/brand/primary` | `→ color/brand/primary` |

### color/text/\*

| Variable               | Light                   | Dark                    |
| ---------------------- | ----------------------- | ----------------------- |
| `color/text/primary`   | `gray/1000`             | `gray/50`               |
| `color/text/secondary` | `gray/700`              | `gray/200`              |
| `color/text/muted`     | `gray/500`              | `gray/300`              |
| `color/text/brand`     | `→ color/brand/primary` | `→ color/brand/primary` |

### color/feedback/\* (use accessible semantic hues)

| Variable                         | Light        | Dark         |
| -------------------------------- | ------------ | ------------ |
| `color/feedback/success/base`    | `green/800`  | `green/700`  |
| `color/feedback/success/subtle`  | `green/100`  | `green/900`  |
| `color/feedback/success/on-base` | `white/1000` | `white/1000` |
| `color/feedback/error/base`      | `red/800`    | `red/700`    |
| `color/feedback/error/subtle`    | `red/100`    | `red/900`    |
| `color/feedback/error/on-base`   | `white/1000` | `white/1000` |
| `color/feedback/info/base`       | `blue/800`   | `blue/700`   |
| `color/feedback/info/subtle`     | `blue/100`   | `blue/900`   |
| `color/feedback/info/on-base`    | `white/1000` | `white/1000` |
| `color/feedback/warning/base`    | `orange/800` | `orange/700` |
| `color/feedback/warning/subtle`  | `orange/100` | `orange/900` |
| `color/feedback/warning/on-base` | `white/1000` | `white/1000` |

### color/button/primary/\* (primary button — most important brand element)

| Variable                                   | Light                   | Dark                    |
| ------------------------------------------ | ----------------------- | ----------------------- |
| `color/button/primary/background/default`  | `→ color/brand/primary` | `→ color/brand/primary` |
| `color/button/primary/background/hover`    | `brand/primary/600`     | `brand/primary/300`     |
| `color/button/primary/background/active`   | `brand/primary/700`     | `brand/primary/200`     |
| `color/button/primary/background/disabled` | `gray/200`              | `gray/700`              |
| `color/button/primary/text/default`        | `white/1000`            | `white/1000`            |
| `color/button/primary/text/disabled`       | `gray/500`              | `gray/400`              |
| `color/button/primary/border/default`      | `transparent`           | `transparent`           |

> For the full set of all 1348 Themes variables and their default mappings, see [token-schema-reference.md](./token-schema-reference.md).

---

## 6. Figma Variable Naming Convention

Variables in Figma use `/` as the path separator:

| JSON path                                                  | Figma variable name                       |
| ---------------------------------------------------------- | ----------------------------------------- |
| `Primitives Colors → brand → primary → 500`                | `brand/primary/500`                       |
| `Themes → color → button → primary → background → default` | `color/button/primary/background/default` |
| `Sizes → typography → heading → h1 → font-size`            | `typography/heading/h1/font-size`         |

Always find variables by exact name match using:

```js
allVars.find((v) => v.name === 'brand/primary/500');
```

---

## 7. Accessibility Reference

### WCAG contrast ratios

- **AA normal text** (< 18px normal / < 14px bold): 4.5:1
- **AA large text** (≥ 18px normal / ≥ 14px bold): 3:1
- **AAA normal text**: 7:1
- **AAA large text**: 4.5:1

### Contrast formula

```
L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  where r/g/b = linearized channel value (≤ 0.04045: c/12.92, else: ((c+0.055)/1.055)^2.4)
ratio = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
```

### Critical pairs to check

1. `color/text/primary` on `color/background/default` — all screens
2. `color/text/secondary` on `color/background/default` — subtitles, labels
3. `color/button/primary/text/default` on `color/button/primary/background/default` — buttons
4. `color/text/brand` on `color/background/default` — branded text elements
5. `color/feedback/*/on-base` on `color/feedback/*/base` — alert/badge text on background

---

## 8. Surfaces Collection — When to Change It

Surfaces variables are **almost always left as-is**. They are pre-set to reference the correct Themes counterparts for each surface context.

The 4 surface modes:

- **Default** → Standard white/light background
- **Subtle** → Slightly gray background (cards, sidebars)
- **Inverse** → Dark background with light text
- **Primary** → Brand-primary-colored background

Only update Surfaces if:

- You need to override specific surface-level colors that differ from Themes (rare)
- The client wants a custom subtle surface (e.g. warm beige instead of gray)

---

## 9. Incremental Script Strategy

Always work in small batches. Recommended split:

| `use_figma` call | What it does                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Call 1           | Create `Design Preview` page — Color Palette section (swatch frames, raw hex)                             |
| Call 2           | Create `Design Preview` page — Typography Scale section                                                   |
| Call 3           | Create `Design Preview` page — UI Sample (web frame: header, hero, cards)                                 |
| Call 4           | Create `Design Preview` page — UI Sample (mobile frame) → screenshot → **wait for approval**              |
| —                | _(iterate on calls 1–4 until client approves the direction)_                                              |
| Call 5           | Set brand.primary + brand.secondary palette in Variables (raw values)                                     |
| Call 6           | Set gray palette in Variables (raw values)                                                                |
| Call 7           | Set green + red palettes in Variables (raw values)                                                        |
| Call 8           | Set blue + orange palettes in Variables (raw values)                                                      |
| Call 9           | Update Themes — color/brand, color/background, color/text, color/icon, color/border, color/ring (aliases) |
| Call 10          | Update Themes — color/control/outline (aliases)                                                           |
| Call 11          | Update Themes — color/control/filled (aliases)                                                            |
| Call 12          | Update Themes — color/feedback (aliases)                                                                  |
| Call 13          | Update Themes — color/action + color/button/primary + color/button/secondary (aliases)                    |
| Call 14          | Update Themes — color/button/outline + ghost + danger, checkbox, radio, select (aliases)                  |
| Call 15          | Update Themes — on-subtle/on-inverse/on-brand-primary variants                                            |
| Call 16          | Update Sizes — font-families, button radius, button uppercase                                             |
| Call 17          | Validate + screenshot                                                                                     |

---

## 10. Final Validation Checklist

Before signalling completion, verify:

- [ ] All Primitives Colors have concrete hex/rgba values (no empty or undefined)
- [ ] Themes color/brand/primary contrast ratio ≥ 3:1 on white (as a standalone color, e.g. for logos)
- [ ] `color/text/primary` on `color/background/default`: ≥ 4.5:1
- [ ] `color/button/primary/text/default` on `color/button/primary/background/default`: ≥ 4.5:1
- [ ] `color/feedback/*/on-base` on `color/feedback/*/base`: ≥ 4.5:1
- [ ] Dark mode background is darker than Light mode background (sanity check)
- [ ] Dark mode text is lighter than Light mode text (sanity check)
- [ ] Font family is set in Sizes collection
- [ ] Button uppercase preference is applied
- [ ] No broken aliases (Theme variable pointing to a non-existent Primitive)

---

## 11. Quick Reference: Collection Names and Modes

| Collection           | Modes                                     |
| -------------------- | ----------------------------------------- |
| `Primitives Colors`  | (single mode — Value)                     |
| `Primitives Sizes`   | (single mode — Value)                     |
| `Primitives Motions` | (single mode — Value)                     |
| `Primitives Shadows` | (single mode — Value)                     |
| `Themes`             | `Default`, `Dark`                         |
| `Surfaces`           | `Default`, `Subtle`, `Inverse`, `Primary` |
| `Sizes`              | `Mobile`, `Desktop`                       |
| `Density`            | `Comfortable`, `Compact`                  |

These are the modes the fork starts with, and filling in their values is the whole of this
workflow — you never add a mode as part of it.

If a client genuinely needs an extra theme (a second brand, a seasonal palette), adding a
mode to `Themes` or `Surfaces` is supported by the token build: it emits one
`[data-theme="…"]` / `[data-surface="…"]` block per mode, kebab-casing the name
(`DarkGreen` → `dark-green`). Two caveats before you do it:

- **Fill every variable in the new mode.** A variable left empty there falls back to the
  `Default` mode, which is correct behaviour but easy to mistake for the mode not working.
- **`Sizes` cannot take extra modes** — a mode there maps to a media query and the build has
  no breakpoint for an unknown name. It warns instead of emitting.
