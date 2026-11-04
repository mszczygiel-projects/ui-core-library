import { configureUiCore } from '@mszczygiel-projects/ui-core-foundations/config';
import type {
  CalendarChangeDetails,
  CalendarProps,
} from '@mszczygiel-projects/ui-core-shared/calendar';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';
import { resolvedColor } from './action.contract.ts';

/**
 * The props of the specification, plus what each harness translates: the first value and month,
 * which the web component takes from its attributes, and the callbacks, which it receives as
 * events.
 */
export interface CalendarContractProps extends CalendarProps {
  readonly defaultValue?: string;
  readonly defaultMonth?: string;
  readonly onValueChange?: Change;
  readonly onMonthChange?: Change;
}

/** A callback of a new value or month. */
type Change = (value: string, details: CalendarChangeDetails<Event>) => void;

/** The behaviour of Calendar, applied unchanged to the web component and the React component. */
export function calendarContract(adapter: Mount<CalendarContractProps>): void {
  const mounted: Mounted<CalendarContractProps>[] = [];
  async function mount(props: CalendarContractProps = {}, options?: MountOptions) {
    const component = await adapter(
      { locale: 'en-US', today: '2026-07-19', defaultValue: '2026-07-08', ...props },
      options,
    );
    mounted.push(component);
    return component;
  }
  const root = (component: Mounted<CalendarContractProps>) =>
    component.element.shadowRoot ?? component.element;
  function cell(component: Mounted<CalendarContractProps>, date: string): HTMLElement {
    const found = root(component).querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (found === null) {
      throw new Error(`Missing the cell of ${date}`);
    }
    return found;
  }
  const focusable = (component: Mounted<CalendarContractProps>) =>
    [...root(component).querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]')].map(
      (element) => element.dataset['date'],
    );
  const selected = (component: Mounted<CalendarContractProps>) =>
    [...root(component).querySelectorAll<HTMLElement>('[aria-selected="true"]')].map(
      (element) => element.dataset['date'],
    );
  const heading = (component: Mounted<CalendarContractProps>) =>
    component.part('heading').textContent;
  const view = (component: Mounted<CalendarContractProps>) =>
    /\b(days|months|years)\b/.exec(component.part('grid').className)?.[1];
  /** The date of the cell that has the focus. */
  function focused(component: Mounted<CalendarContractProps>): string | undefined {
    const active =
      root(component) instanceof ShadowRoot
        ? (root(component) as ShadowRoot).activeElement
        : document.activeElement;
    return active instanceof HTMLElement ? active.dataset['date'] : undefined;
  }
  async function press(component: Mounted<CalendarContractProps>, keys: string) {
    await userEvent.keyboard(keys);
    await component.update({});
  }
  async function focusCell(component: Mounted<CalendarContractProps>) {
    root(component).querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    await component.update({});
  }

  afterEach(async () => {
    configureUiCore({ labels: {} });
    for (const component of mounted.splice(0)) {
      await component.unmount();
    }
  });

  it('is a grid named by its heading, with weekday columns and named days', async () => {
    const component = await mount();
    const tree = await component.accessibleTree();
    expect(tree.find((node) => node.role === 'grid')?.name).toBe('July 2026');
    const headers = root(component).querySelectorAll('th');
    expect([...headers].map((header) => header.getAttribute('abbr'))).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    const day = component.screen.getByRole('gridcell', { name: 'Wednesday, July 8, 2026' });
    await expect.element(day).toHaveAttribute('aria-selected', 'true');
    expect(cell(component, '2026-07-19').getAttribute('aria-current')).toBe('date');
    expect(cell(component, '2026-06-28').getAttribute('aria-selected')).toBe('false');
    expect(focusable(component)).toEqual(['2026-07-08']);
  });

  it('names months and days in its locale and starts the week where the locale does', async () => {
    const polish = await mount({ locale: 'pl-PL' });
    expect(heading(polish)).toBe('lipiec 2026');
    expect(root(polish).querySelector('th')?.getAttribute('abbr')).toBe('poniedziałek');
    const sunday = await mount({ locale: 'pl-PL', firstDayOfWeek: 7 });
    expect(root(sunday).querySelector('th')?.getAttribute('abbr')).toBe('niedziela');
  });

  it('picks a day once, and a value that the parent sets shows its month without an event', async () => {
    const onValueChange = vi.fn<Change>();
    const onMonthChange = vi.fn<Change>();
    const component = await mount({ onValueChange, onMonthChange });
    cell(component, '2026-07-09').click();
    await component.update({});
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toBe('2026-07-09');
    expect(selected(component)).toEqual(['2026-07-09']);
    await component.update({ value: '2027-02-03' });
    expect(heading(component)).toBe('February 2027');
    expect(selected(component)).toEqual(['2027-02-03']);
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onMonthChange).not.toHaveBeenCalled();
  });

  it('picks a range by its two ends in either order, and reports it once complete', async () => {
    const onValueChange = vi.fn<Change>();
    const component = await mount({
      range: true,
      defaultValue: '2026-07-08/2026-07-14',
      onValueChange,
    });
    expect(selected(component)).toEqual([
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
    ]);
    cell(component, '2026-07-22').click();
    await component.update({});
    expect(onValueChange).not.toHaveBeenCalled();
    expect(selected(component)).toEqual(['2026-07-22']);
    cell(component, '2026-07-20').click();
    await component.update({});
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toBe('2026-07-20/2026-07-22');
    expect(cell(component, '2026-07-21').className).toMatch(/middle/);
  });

  it('keeps disabled days in the keys but never picks them', async () => {
    const onValueChange = vi.fn<Change>();
    const component = await mount({
      min: '2026-07-05',
      max: '2026-07-30',
      disabledDates: (date) => date === '2026-07-10',
      onValueChange,
    });
    for (const date of ['2026-07-04', '2026-07-10', '2026-07-31']) {
      expect(cell(component, date).getAttribute('aria-disabled')).toBe('true');
      cell(component, date).click();
    }
    await component.update({});
    expect(onValueChange).not.toHaveBeenCalled();
    await focusCell(component);
    await press(component, '{ArrowRight}{ArrowRight}');
    expect(focused(component)).toBe('2026-07-10');
    await press(component, '{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
    await expect
      .element(component.screen.getByRole('button', { name: 'Previous month' }))
      .toBeDisabled();
    await expect
      .element(component.screen.getByRole('button', { name: 'Next month' }))
      .toBeDisabled();
  });

  it('moves the focus by the keys of the date picker pattern and follows it to other months', async () => {
    const onMonthChange = vi.fn<Change>();
    const onValueChange = vi.fn<Change>();
    const component = await mount({ onMonthChange, onValueChange });
    await focusCell(component);
    await press(component, '{ArrowRight}');
    expect(focused(component)).toBe('2026-07-09');
    await press(component, '{ArrowDown}');
    expect(focused(component)).toBe('2026-07-16');
    await press(component, '{Home}');
    expect(focused(component)).toBe('2026-07-12');
    await press(component, '{End}');
    expect(focused(component)).toBe('2026-07-18');
    await press(component, '{PageDown}');
    expect(focused(component)).toBe('2026-08-18');
    expect(heading(component)).toBe('August 2026');
    expect(onMonthChange.mock.calls.map((call) => call[0])).toEqual(['2026-08']);
    await press(component, '{Shift>}{PageUp}{/Shift}');
    expect(focused(component)).toBe('2025-08-18');
    expect(focusable(component)).toEqual(['2025-08-18']);
    await press(component, '{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(focused(component)).toBe('2025-07-28');
    expect(onMonthChange.mock.calls.map((call) => call[0])).toEqual([
      '2026-08',
      '2025-08',
      '2025-07',
    ]);
    await press(component, ' ');
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual(['2025-07-28']);
  });

  it('turns the horizontal arrows in right-to-left text', async () => {
    const component = await mount({}, { dir: 'rtl' });
    await focusCell(component);
    await press(component, '{ArrowLeft}');
    expect(focused(component)).toBe('2026-07-09');
    await press(component, '{ArrowRight}{ArrowRight}');
    expect(focused(component)).toBe('2026-07-07');
  });

  it('steps by month with its buttons, named by props and the configuration', async () => {
    const onMonthChange = vi.fn<Change>();
    const component = await mount({ onMonthChange });
    await component.screen.getByRole('button', { name: 'Next month' }).click();
    await component.update({});
    expect(heading(component)).toBe('August 2026');
    expect(onMonthChange.mock.calls.map((call) => call[0])).toEqual(['2026-08']);
    configureUiCore({ labels: { calendar: { previousMonth: 'Poprzedni miesiąc' } } });
    await component.update({ nextMonthLabel: 'Later' });
    await vi.waitFor(async () => {
      await expect
        .element(component.screen.getByRole('button', { name: 'Poprzedni miesiąc' }))
        .toBeInTheDocument();
    });
    await component.screen.getByRole('button', { name: 'Later' }).click();
    await component.update({});
    expect(heading(component)).toBe('September 2026');
  });

  it('opens the months and the years from its heading, and Escape goes back one grid', async () => {
    const onValueChange = vi.fn<Change>();
    const component = await mount({ onValueChange, max: '2030-06-15' });
    await component.screen.getByRole('button', { name: 'July 2026, choose a month' }).click();
    await component.update({});
    expect(view(component)).toBe('months');
    expect(focused(component)).toBe('2026-07-08');
    await component.screen.getByRole('button', { name: '2026, choose a year' }).click();
    await component.update({});
    expect(view(component)).toBe('years');
    expect(heading(component)).toMatch(/^2016\s?–\s?2039$/);
    expect(cell(component, '2031-07-08').getAttribute('aria-disabled')).toBe('true');
    await press(component, '{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}');
    expect(view(component)).toBe('months');
    expect(heading(component)).toBe('2030');
    expect(cell(component, '2030-07-08').getAttribute('aria-disabled')).toBe('true');
    await press(component, '{ArrowLeft}{ArrowLeft}{Enter}');
    expect(view(component)).toBe('days');
    expect(heading(component)).toBe('May 2030');
    expect(focused(component)).toBe('2030-05-08');
    expect(onValueChange).not.toHaveBeenCalled();
    await component.screen.getByRole('button', { name: 'May 2030, choose a month' }).click();
    await component.update({});
    await press(component, '{Escape}');
    expect(view(component)).toBe('days');
    expect(focused(component)).toBe('2030-05-08');
  });

  it('lets Escape over the days reach the page, and keeps it in the grids behind the heading', async () => {
    const component = await mount();
    const escapes = vi.fn();
    document.addEventListener('keydown', escapes);
    try {
      await focusCell(component);
      await press(component, '{Escape}');
      expect(escapes).toHaveBeenCalledOnce();
      await component.screen.getByRole('button', { name: 'July 2026, choose a month' }).click();
      await component.update({});
      await press(component, '{Escape}');
      expect(escapes).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener('keydown', escapes);
    }
  });

  it('draws the chosen day and its focus ring from its tokens', async () => {
    const component = await mount();
    const label = (date: string) => cell(component, date).firstElementChild as HTMLElement;
    expect(getComputedStyle(label('2026-07-08')).backgroundColor).toBe(
      resolvedColor(tokenValue('--color-calendar-day-background-selected')),
    );
    expect(getComputedStyle(cell(component, '2026-07-08')).color).toBe(
      resolvedColor(tokenValue('--color-calendar-day-text-selected')),
    );
    expect(getComputedStyle(label('2026-07-08')).blockSize).toBe(
      `${String(pixels(tokenValue('--calendar-day-size')))}px`,
    );
    // Keyboard focus, so that :focus-visible applies without any global stylesheet.
    await userEvent.keyboard('{Tab}');
    await focusCell(component);
    expect(Number.parseFloat(getComputedStyle(label('2026-07-08')).outlineWidth)).toBe(
      pixels(tokenValue('--ring-width')),
    );
    expect(getComputedStyle(label('2026-07-08')).outlineColor).toBe(
      resolvedColor(tokenValue('--color-ring-default')),
    );
  });
}
