import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  notification,
  type NotificationDismissDetail,
  type NotificationProps,
} from '@mszczygiel-projects/ui-core-shared/notification';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { appearance } from '../appearance.ts';
import { textContrast } from '../contrast.ts';
import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pseudoLabels } from '../pseudo.ts';
import { pixels, tokenNumber, tokenValue } from '../tokens.ts';

/**
 * The props of the specification, plus what each harness translates: the description as text and
 * the callback, which the web component receives as an event.
 */
export interface NotificationContractProps extends NotificationProps {
  readonly children?: string;
  readonly onDismiss?: (details: NotificationDismissDetail<Event>) => void;
}

const { options } = notification;

/** The behaviour of Notification, applied unchanged to the web component and the React component. */
export function notificationContract(adapter: Mount<NotificationContractProps>): void {
  const mounted: Mounted<NotificationContractProps>[] = [];
  async function mount(props: NotificationContractProps = {}, mountOptions?: MountOptions) {
    const component = await adapter(
      { heading: 'Changes saved', children: 'Your profile is up to date.', ...props },
      mountOptions,
    );
    mounted.push(component);
    return component;
  }
  const live = async (component: Mounted<NotificationContractProps>) =>
    (await component.accessibleTree()).filter(
      (node) => node.role === 'status' || node.role === 'alert',
    );
  /** A part that may be absent: React leaves out what the web component hides. */
  const optionalPart = (component: Mounted<NotificationContractProps>, name: string) =>
    component.element.shadowRoot?.querySelector<HTMLElement>(`[part~="${name}"]`) ??
    component.element.querySelector<HTMLElement>(`.ui-notification__${name}`);
  const shown = (element: HTMLElement | null) =>
    element !== null && getComputedStyle(element).display !== 'none';
  const dismissName = async (component: Mounted<NotificationContractProps>) =>
    (await component.accessibleTree()).find((node) => node.role === 'button')?.name;

  afterEach(async () => {
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });

  it('uses the documented defaults and falls back after invalid runtime settings', async () => {
    const defaults = await mount();
    const explicit = await mount({ tone: 'info', variant: 'solid' });
    const base = defaults.part('base');
    expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    for (const value of ['unsupported', null, 42]) {
      await defaults.update({
        tone: value,
        variant: value,
      } as unknown as NotificationContractProps);
      expect(appearance(base)).toEqual(appearance(explicit.part('base')));
    }
    expect(await live(defaults)).toEqual([]);
  });

  it('shows its heading and its description, and hides an empty description', async () => {
    const component = await mount();
    expect(component.part('heading').textContent).toBe('Changes saved');
    expect(component.element.textContent).toContain('Your profile is up to date.');
    expect(shown(optionalPart(component, 'description'))).toBe(true);
    const empty = await mount({ children: '' });
    expect(shown(optionalPart(empty, 'description'))).toBe(false);
  });

  it('takes its colours from its own tokens, so that a theme of the component reaches it', async () => {
    for (const variant of options.variant.options) {
      const component = await mount({ tone: 'warning', variant });
      const root = component.element;
      const token = `--color-notification-warning-${variant}`;
      root.style.setProperty(`${token}-background`, 'rgb(1, 2, 3)');
      root.style.setProperty(`${token}-text-heading`, 'rgb(4, 5, 6)');
      root.style.setProperty(`${token}-text-description`, 'rgb(7, 8, 9)');
      root.style.setProperty(`${token}-border-default`, 'rgb(10, 11, 12)');
      root.style.setProperty(`${token}-border-accent`, 'rgb(13, 14, 15)');
      root.style.setProperty(`${token}-link-default`, 'rgb(16, 17, 18)');
      root.style.setProperty('--notification-border-width', '3px');
      const base = getComputedStyle(component.part('base'));
      expect(base.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(base.color).toBe('rgb(4, 5, 6)');
      expect(getComputedStyle(component.part('heading')).color).toBe('rgb(4, 5, 6)');
      expect(getComputedStyle(component.part('description')).color).toBe('rgb(7, 8, 9)');
      expect(base.borderBlockStartColor).toBe('rgb(10, 11, 12)');
      expect(base.borderInlineEndColor).toBe('rgb(10, 11, 12)');
      expect(base.borderBlockStartWidth).toBe('3px');
      expect(base.borderInlineStartColor).toBe('rgb(13, 14, 15)');
      // A link that the page puts in the description: light DOM of a web component, markup in React.
      const link = document.createElement('a');
      link.href = '#details';
      link.textContent = 'Details';
      (root.shadowRoot === null ? component.part('description') : root).append(link);
      expect(getComputedStyle(link).color).toBe('rgb(16, 17, 18)');
      // Only a direct link: a link nested in a paragraph keeps the styles of the page.
      const paragraph = document.createElement('p');
      const nested = document.createElement('a');
      nested.href = '#more';
      nested.textContent = 'More';
      paragraph.append(nested);
      (root.shadowRoot === null ? component.part('description') : root).append(paragraph);
      expect(getComputedStyle(nested).color).not.toBe('rgb(16, 17, 18)');
      paragraph.remove();
      link.remove();
    }
  });

  it('draws in Core only the accent of its tone, with no border on the other sides', async () => {
    for (const variant of options.variant.options) {
      const component = await mount({ tone: 'info', variant });
      const base = getComputedStyle(component.part('base'));
      expect(base.borderBlockStartWidth).toBe(
        `${String(pixels(tokenValue('--notification-border-width')))}px`,
      );
      expect(pixels(base.borderInlineStartWidth)).toBe(
        pixels(tokenValue('--notification-border-accent-width')),
      );
    }
  });

  it('takes its spacing and the size of its icons from its own tokens', async () => {
    const component = await mount({ hasLeadingIcon: true, dismissible: true });
    const root = component.element;
    root.style.setProperty('--notification-gap', '11px');
    root.style.setProperty('--notification-header-gap', '13px');
    root.style.setProperty('--notification-icon-size', '17px');
    const header = component.part('header').getBoundingClientRect();
    const description = component.part('description').getBoundingClientRect();
    expect(description.top - header.bottom).toBeCloseTo(11, 0);
    const icon = component.part('icon').getBoundingClientRect();
    const heading = component.part('heading').getBoundingClientRect();
    expect(icon.width).toBeCloseTo(17, 0);
    expect(heading.left - icon.right).toBeCloseTo(13, 0);
    expect(component.part('dismiss').getBoundingClientRect().width).toBeCloseTo(17, 0);
  });

  it('shows the decorative icon of its tone only when it has a leading icon', async () => {
    const plain = await mount();
    expect(shown(optionalPart(plain, 'icon'))).toBe(false);
    const icons = new Map<string, string>();
    for (const tone of options.tone.options) {
      const component = await mount({ tone, hasLeadingIcon: true });
      const icon = component.part('icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.getBoundingClientRect().width).toBe(
        pixels(tokenValue('--notification-icon-size')),
      );
      icons.set(tone, icon.innerHTML);
      const tree = await component.accessibleTree();
      expect(tree.some((node) => node.role === 'image')).toBe(false);
    }
    expect(new Set([icons.get('info'), icons.get('success'), icons.get('warning')]).size).toBe(3);
  });

  it('is a live region only when it announces itself: an alert for an error, a status otherwise', async () => {
    for (const tone of options.tone.options) {
      const quiet = await mount({ tone });
      expect(await live(quiet)).toEqual([]);
      const announced = await mount({ tone, announce: true });
      const expected = tone === 'error' ? 'alert' : 'status';
      await expect
        .poll(async () => (await live(announced)).map((node) => node.role))
        .toEqual([expected]);
      // The content shows once the region is in place, so that a screen reader reads it.
      await expect.poll(() => getComputedStyle(announced.part('header')).display).not.toBe('none');
      expect(announced.text()).toContain('Changes saved');
    }
  });

  it('keeps a role and a name that the page writes on it', async () => {
    const component = await mount(
      { tone: 'error', announce: true },
      { attributes: { role: 'region', 'aria-label': 'Payment' } },
    );
    await component.update({ tone: 'success', variant: 'subtle', dismissible: true });
    expect([
      component.element.getAttribute('role'),
      component.element.getAttribute('aria-label'),
    ]).toEqual(['region', 'Payment']);
  });

  it('offers a dismiss button only when it is dismissible, named by the dismiss label and its heading', async () => {
    const plain = await mount();
    expect((await plain.accessibleTree()).some((node) => node.role === 'button')).toBe(false);
    const component = await mount({ dismissible: true });
    expect(await dismissName(component)).toBe('Dismiss Changes saved');
    configureUiCore({ labels: pseudoLabels });
    await expect
      .poll(() => dismissName(component))
      .toBe(`${pseudoLabels.notification.dismiss} Changes saved`);
    configureUiCore({ labels: { notification: { dismiss: 'Zamknij' } } });
    await expect.poll(() => dismissName(component)).toBe('Zamknij Changes saved');
    await component.update({ dismissLabel: 'Hide' });
    expect(await dismissName(component)).toBe('Hide Changes saved');
  });

  it('asks to be removed with its dismiss button and leaves the removal to the page', async () => {
    const dismissed = vi.fn<NonNullable<NotificationContractProps['onDismiss']>>();
    const component = await mount({ dismissible: true, onDismiss: dismissed });
    await userEvent.click(component.part('dismiss'));
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(dismissed.mock.lastCall?.[0].originalEvent).toBeInstanceOf(Event);
    expect(component.element.isConnected).toBe(true);
  });

  it('disappears with its dismiss button when the page hides it', async () => {
    const component = await mount({ dismissible: true }, { attributes: { hidden: 'hidden' } });
    expect(getComputedStyle(component.element).display).toBe('none');
    expect(component.part('dismiss').getClientRects()).toHaveLength(0);
    expect((await component.accessibleTree()).some((node) => node.role === 'button')).toBe(false);
  });

  it('disables its dismiss button inside a disabled fieldset', async () => {
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    document.body.append(fieldset);
    const dismissed = vi.fn();
    const component = await mount(
      { dismissible: true, onDismiss: dismissed },
      { parent: fieldset },
    );
    const dismiss = component.part('dismiss');
    await expect.poll(() => dismiss.matches(':disabled')).toBe(true);
    dismiss.click();
    expect(dismissed).not.toHaveBeenCalled();
    fieldset.disabled = false;
    await expect.poll(() => component.part('dismiss').matches(':disabled')).toBe(false);
    await userEvent.click(component.part('dismiss'));
    expect(dismissed).toHaveBeenCalledTimes(1);
    await component.unmount();
    mounted.splice(mounted.indexOf(component), 1);
    fieldset.remove();
  });

  it('shows the focus ring on its dismiss button only for keyboard focus', async () => {
    const component = await mount({ dismissible: true });
    const dismiss = component.part('dismiss');
    await userEvent.click(dismiss);
    expect(getComputedStyle(dismiss).outlineStyle).toBe('none');
    dismiss.blur();
    await userEvent.keyboard('{Tab}');
    dismiss.focus();
    await expect.poll(() => getComputedStyle(dismiss).outlineStyle).toBe('solid');
  });

  for (const density of ['comfortable', 'compact'] as const) {
    it(`gives its dismiss button a target of at least 24 px in ${density} density`, async () => {
      const component = await mount({ dismissible: true }, { density });
      const minimum = tokenNumber('--notification-dismiss-target-min-size');
      expect(minimum).toBeGreaterThanOrEqual(24);
      const part = component.part('dismiss');
      const box = part.getBoundingClientRect();
      const root = part.getRootNode() as Document | ShadowRoot;
      const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const reach = minimum / 2 - 1;
      for (const [x, y] of [
        [centre.x - reach, centre.y],
        [centre.x + reach, centre.y],
        [centre.x, centre.y - reach],
        [centre.x, centre.y + reach],
      ] as const) {
        const hit = root.elementFromPoint(x, y);
        expect(hit !== null && part.contains(hit), `at ${String(x)},${String(y)}`).toBe(true);
      }
    });
  }

  it('wraps a long heading beside its dismiss button without covering it', async () => {
    const component = await mount({
      heading: 'A heading long enough to wrap onto a second line inside a narrow notification',
      dismissible: true,
      hasLeadingIcon: true,
    });
    component.element.style.setProperty('inline-size', '240px');
    const heading = component.part('heading').getBoundingClientRect();
    const dismiss = component.part('dismiss').getBoundingClientRect();
    expect(heading.height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(component.part('heading')).lineHeight),
    );
    expect(heading.right).toBeLessThanOrEqual(dismiss.left);
  });

  it('follows right-to-left text: its icon and its accent at the start, its dismiss button at the end', async () => {
    const component = await mount(
      { hasLeadingIcon: true, dismissible: true, variant: 'subtle' },
      { dir: 'rtl' },
    );
    const icon = component.part('icon').getBoundingClientRect();
    const heading = component.part('heading').getBoundingClientRect();
    const dismiss = component.part('dismiss').getBoundingClientRect();
    expect(icon.left).toBeGreaterThan(heading.right - 1);
    expect(dismiss.right).toBeLessThanOrEqual(heading.left);
    const base = getComputedStyle(component.part('base'));
    expect(base.borderRightWidth).not.toBe('0px');
    expect(base.borderLeftWidth).toBe('0px');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`keeps its text readable for every tone and variant on every ${theme} surface`, async () => {
      for (const surface of ['default', 'subtle', 'inverse', 'primary'] as const) {
        for (const tone of options.tone.options) {
          for (const variant of options.variant.options) {
            const component = await adapter(
              { heading: 'Changes saved', children: 'Details', tone, variant },
              { theme, surface },
            );
            for (const part of ['heading', 'description']) {
              const ratio = textContrast(component.part(part));
              expect(ratio, `${tone} ${variant} ${part} on ${surface}`).toBeGreaterThanOrEqual(4.5);
            }
            await component.unmount();
          }
        }
      }
    });
  }
}
