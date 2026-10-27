import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  chip,
  type ChipDismissDetail,
  type ChipProps,
  type ChipSelectedChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/chip';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { textContrast } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { tokenNumber } from '../tokens.ts';

/**
 * The props of the specification, plus what each harness translates: the text, the icon as a
 * flag, the initial state and the callbacks, which the web component receives as events.
 */
export interface ChipContractProps extends ChipProps {
  readonly children?: string;
  readonly icon?: boolean;
  readonly defaultSelected?: boolean;
  readonly onSelectedChange?: (
    selected: boolean,
    details: ChipSelectedChangeDetails<Event>,
  ) => void;
  readonly onDismiss?: (details: ChipDismissDetail<Event>) => void;
}

const { options } = chip;

/** The behaviour of Chip, applied unchanged to the web component and the React component. */
export function chipContract(adapter: Mount<ChipContractProps>): void {
  const mounted: Mounted<ChipContractProps>[] = [];
  async function mount(props: ChipContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter({ children: 'Open now', ...props }, mountOptions);
    mounted.push(component);
    return component;
  }
  const dismissButton = (component: Mounted<ChipContractProps>) => component.part('dismiss');

  /** Moves the pointer to a corner of the page, so that no chip is in the active state. */
  async function restPointer() {
    const corner = document.createElement('div');
    corner.style.cssText =
      'position: fixed; inset-block-end: 0; inset-inline-end: 0; inline-size: 4px; block-size: 4px;';
    document.body.append(corner);
    await userEvent.hover(corner);
    corner.remove();
  }

  afterEach(async () => {
    await restPointer();
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ variant: 'outline', size: 'medium' });
    await restPointer();
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({ variant: value, size: value } as unknown as ChipContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    }
  });

  it('shows static text, with no toggle, unless it is selectable', async () => {
    const component = await mount({ icon: true, selected: true });
    const tree = await component.accessibleTree();
    expect(tree.some((node) => node.role === 'button')).toBe(false);
    expect(tree.some((node) => node.name === 'Decorative star')).toBe(false);
    expect(component.part('control').hasAttribute('aria-pressed')).toBe(false);
    expect(component.element.textContent).toContain('Open now');
  });

  it('is a toggle button named by its text when it is selectable', async () => {
    const component = await mount({ selectable: true, icon: true, defaultSelected: true });
    const buttons = (await component.accessibleTree()).filter((node) => node.role === 'button');
    expect(buttons).toEqual([{ role: 'button', name: 'Open now' }]);
    expect(component.part('control').getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles with the pointer and Space, and reports each new state', async () => {
    const changed = vi.fn<NonNullable<ChipContractProps['onSelectedChange']>>();
    const component = await mount({ selectable: true, onSelectedChange: changed });
    const control = component.part('control');
    await userEvent.click(control);
    expect(control.getAttribute('aria-pressed')).toBe('true');
    expect(changed.mock.lastCall?.[0]).toBe(true);
    expect(changed.mock.lastCall?.[1].originalEvent).toBeInstanceOf(Event);
    control.focus();
    await userEvent.keyboard(' ');
    expect(control.getAttribute('aria-pressed')).toBe('false');
    expect(changed.mock.lastCall?.[0]).toBe(false);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('asks to be removed with its dismiss button, Delete and Backspace, without toggling', async () => {
    const changed = vi.fn();
    const dismissed = vi.fn<NonNullable<ChipContractProps['onDismiss']>>();
    const component = await mount({
      selectable: true,
      dismissible: true,
      onSelectedChange: changed,
      onDismiss: dismissed,
    });
    await userEvent.click(dismissButton(component));
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(dismissed.mock.lastCall?.[0].originalEvent).toBeInstanceOf(Event);
    component.part('control').focus();
    await userEvent.keyboard('{Delete}');
    dismissButton(component).focus();
    await userEvent.keyboard('{Backspace}');
    expect(dismissed).toHaveBeenCalledTimes(3);
    expect(changed).not.toHaveBeenCalled();
    expect(component.part('control').getAttribute('aria-pressed')).toBe('false');
  });

  it('ignores Delete and Backspace when it is not dismissible', async () => {
    const dismissed = vi.fn();
    const component = await mount({ selectable: true, onDismiss: dismissed });
    component.part('control').focus();
    await userEvent.keyboard('{Delete}{Backspace}');
    expect(dismissed).not.toHaveBeenCalled();
  });

  it('names its dismiss button by the dismiss label and its text', async () => {
    const component = await mount({ dismissible: true });
    const named = async () =>
      (await component.accessibleTree()).find((node) => node.role === 'button')?.name;
    expect(await named()).toBe('Remove Open now');
    configureUiCore({ labels: pseudoLabels });
    await expect.poll(named).toBe(`${pseudoLabels.chip.dismiss} Open now`);
    configureUiCore({ labels: { chip: { dismiss: 'Usuń' } } });
    await expect.poll(named).toBe('Usuń Open now');
    await component.update({ dismissLabel: 'Clear' });
    expect(await named()).toBe('Clear Open now');
  });

  it('names itself, and its dismiss button, by an aria-label of the author', async () => {
    for (const selectable of [true, false]) {
      const component = await mount(
        { selectable, dismissible: true, children: 'Open' },
        { attributes: { 'aria-label': 'Filter: open now' } },
      );
      const buttons = (await component.accessibleTree()).filter((node) => node.role === 'button');
      expect(buttons.map((node) => node.name)).toEqual([
        ...(selectable ? ['Filter: open now'] : []),
        'Remove Filter: open now',
      ]);
    }
  });

  it('stops every action inside a disabled fieldset', async () => {
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    document.body.append(fieldset);
    const changed = vi.fn();
    const dismissed = vi.fn();
    const component = await mount(
      { selectable: true, dismissible: true, onSelectedChange: changed, onDismiss: dismissed },
      { parent: fieldset },
    );
    const control = component.part('control');
    expect(control.matches(':disabled')).toBe(true);
    control.click();
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    // The dismiss button is gone, or disabled where the fieldset alone disables it.
    const dismiss =
      component.element.shadowRoot?.querySelector('[part~="dismiss"]') ??
      component.element.querySelector('.ui-chip__dismiss');
    if (dismiss instanceof HTMLElement) {
      expect(dismiss.matches(':disabled')).toBe(true);
      expect(getComputedStyle(dismiss).display).toBe('none');
      dismiss.click();
    }
    expect(changed).not.toHaveBeenCalled();
    expect(dismissed).not.toHaveBeenCalled();
    fieldset.disabled = false;
    await expect.poll(() => control.matches(':disabled')).toBe(false);
    await userEvent.click(component.part('control'));
    expect(changed).toHaveBeenCalledTimes(1);
    fieldset.remove();
  });

  it('removes its dismiss button and stops every action while disabled', async () => {
    const changed = vi.fn();
    const dismissed = vi.fn();
    const component = await mount({
      selectable: true,
      dismissible: true,
      disabled: true,
      onSelectedChange: changed,
      onDismiss: dismissed,
    });
    const control = component.part('control');
    expect(control.matches(':disabled')).toBe(true);
    const tree = await component.accessibleTree();
    expect(tree.filter((node) => node.role === 'button')).toEqual([
      { role: 'button', name: 'Open now' },
    ]);
    control.click();
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(changed).not.toHaveBeenCalled();
    expect(dismissed).not.toHaveBeenCalled();
    await component.update({ disabled: false });
    expect(dismissButton(component)).toBeDefined();
  });

  it('shows the focus ring around the chip only for keyboard focus', async () => {
    const component = await mount({ selectable: true });
    const base = component.part('base');
    const control = component.part('control');
    await userEvent.click(control);
    expect(getComputedStyle(base).outlineStyle).toBe('none');
    control.blur();
    // Keyboard focus, so that :focus-visible applies without any global stylesheet.
    await userEvent.keyboard('{Tab}');
    control.focus();
    await expect.poll(() => getComputedStyle(base).outlineStyle).toBe('solid');
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`gives its toggle and its dismiss button a target of at least 24 px in ${density} density`, async () => {
      for (const size of options.size.options) {
        const component = await mount({ size, selectable: true, dismissible: true }, { density });
        // Room around the chip, so that every point of its targets lies inside the page.
        component.element.parentElement?.style.setProperty('padding', '16px');
        const minimum = tokenNumber('--chip-target-min-size');
        expect(minimum).toBeGreaterThanOrEqual(24);
        for (const name of ['control', 'dismiss']) {
          const part = component.part(name);
          const box = part.getBoundingClientRect();
          const root = part.getRootNode() as Document | ShadowRoot;
          const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
          const reach = minimum / 2 - 1;
          const points =
            name === 'dismiss'
              ? [
                  [centre.x - reach, centre.y],
                  [centre.x + reach, centre.y],
                  [centre.x, centre.y - reach],
                  [centre.x, centre.y + reach],
                ]
              : [
                  [centre.x, centre.y - reach],
                  [centre.x, centre.y + reach],
                ];
          for (const [x = 0, y = 0] of points) {
            const hit = root.elementFromPoint(x, y);
            expect(
              hit !== null && part.contains(hit),
              `${size} ${name} at ${String(x)},${String(y)}`,
            ).toBe(true);
          }
        }
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`keeps its text readable at rest and selected on every ${theme} surface`, async () => {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const variant of options.variant.options) {
          for (const defaultSelected of [false, true]) {
            const component = await adapter(
              { children: 'Open now', variant, selectable: true, defaultSelected },
              { theme, surface },
            );
            // The frame paints its surface, as a page does behind a chip without a fill.
            const frame = component.element.parentElement;
            frame?.style.setProperty('background-color', 'var(--color-background-default)');
            const ratio = textContrast(component.part('base'));
            expect(
              ratio,
              `${variant} ${String(defaultSelected)} on ${surface}`,
            ).toBeGreaterThanOrEqual(4.5);
            await component.unmount();
          }
        }
      }
    });
  }
}
