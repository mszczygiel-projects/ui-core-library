import type { ParsedFieldProps } from '@mszczygiel-projects/ui-core-shared/parsed-input';
import { expect, it } from 'vitest';
import { commands, userEvent } from 'vitest/browser';

import { contrastRatio } from '../contrast.ts';
import type { Mount } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';

/** The control palette and preference checks shared by the two parsed fields. */
export function parsedFieldAppearanceContract<Props extends ParsedFieldProps>(
  mount: Mount<Props>,
  defaults: Props,
  action?: string,
): void {
  it('keeps filled text, label, hint and placeholder legible on every surface', async () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        const context = { theme, surface };
        const field = await mount(
          {
            ...defaults,
            variant: 'filled',
            labelPlacement: 'inner',
            label: 'Entry',
            hint: 'Feedback',
            placeholder: 'Example',
          },
          context,
        );
        try {
          const probe = document.createElement('span');
          probe.style.color = tokenValue('--color-background-default', context);
          document.body.append(probe);
          const outer = getComputedStyle(probe).color;
          probe.remove();
          const background = getComputedStyle(field.part('control')).backgroundColor;
          for (const color of [
            getComputedStyle(field.part('input')).color,
            getComputedStyle(field.part('input'), '::placeholder').color,
            getComputedStyle(field.part('label')).color,
          ]) {
            expect(contrastRatio(color, background), `${theme}/${surface}`).toBeGreaterThanOrEqual(
              4.5,
            );
          }
          expect(
            contrastRatio(getComputedStyle(field.part('hint')).color, outer),
          ).toBeGreaterThanOrEqual(4.5);
        } finally {
          await field.unmount();
        }
      }
    }
  });

  it('follows RTL, keeps every label placement and sizes its action target from tokens', async () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const labelPlacement of ['top', 'floating', 'inner'] as const) {
        const field = await mount(
          { ...defaults, size, labelPlacement, label: 'Entry' },
          { dir: 'rtl' },
        );
        try {
          expect(getComputedStyle(field.part('input')).direction).toBe('rtl');
          const label = field.part('label').getBoundingClientRect();
          const control = field.part('control').getBoundingClientRect();
          if (labelPlacement === 'top') {
            expect(label.bottom).toBeLessThanOrEqual(control.top);
          } else {
            expect(label.top).toBeGreaterThanOrEqual(control.top);
          }
          if (action !== undefined) {
            const button = field.part(action);
            const target = getComputedStyle(button, '::after');
            const box = button.getBoundingClientRect();
            const minimum = pixels(tokenValue('--control-action-target-min-size'));
            expect(
              box.height - 2 * Number.parseFloat(target.insetBlockStart),
            ).toBeGreaterThanOrEqual(minimum);
            expect(
              box.width - 2 * Number.parseFloat(target.insetInlineStart),
            ).toBeGreaterThanOrEqual(minimum);
          }
        } finally {
          await field.unmount();
        }
      }
    }
  });

  it('keeps a keyboard focus indicator in forced colors and removes reduced-motion animation', async () => {
    const field = await mount({ ...defaults, label: 'Entry', labelPlacement: 'floating' });
    const before = document.createElement('button');
    field.element.before(before);
    try {
      await commands.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      before.focus();
      await userEvent.tab();
      if (action !== undefined) {
        await userEvent.tab();
      }
      expect(field.part('input').matches(':focus-visible')).toBe(true);
      expect(getComputedStyle(field.part('control')).outlineStyle).not.toBe('none');
      expect(getComputedStyle(field.part('label')).transitionDuration).toBe('0s');
    } finally {
      await commands.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
      await field.unmount();
      before.remove();
    }
  });
}
