import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  tabs as tabsSpec,
  type TabsOrientation,
  type TabsProps,
  type TabsValueChangeReason,
  type TabsVariant,
} from '@mszczygiel-projects/ui-core-shared/tabs';
import { nextTab, selectedTabValue } from '@mszczygiel-projects/ui-core-shared/tabs-navigation';
import {
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import { registerTabs, tabEntriesOf, type TabEntry } from '../internal/tabs.ts';
import type { TabsValueChange as ValueChange } from './events.ts';

const { variant: variantOption, orientation: orientationOption } = tabsSpec.options;

/**
 * A list of tabs, each of which shows its own panel of content in place of the others.
 *
 * Its children are `ui-tab` elements. It renders a tab for each in a list with the role `tablist`,
 * and places each `ui-tab` in a panel named by its tab, so the content stays in the page. The
 * panels of the other tabs are `hidden="until-found"`, so find in page and a link to a text
 * fragment select the tab of a match. A press selects a tab, and the arrow keys along the list
 * move the focus and select the tab they reach, Home and End the first and last; each dispatches
 * `ui-value-change`. Tab moves the focus from the selected tab to its panel.
 *
 * @slot - The tabs, ui-tab elements.
 * @part base - The wrapper of the list and the panels.
 * @part list - The list of tabs.
 * @part tab - A tab.
 * @part tab-icon - The icon of a tab.
 * @part tab-label - The text of a tab.
 * @part panel - The panel of a tab, which holds its ui-tab.
 */
@Component({
  tag: 'ui-tabs',
  styleUrl: 'tabs.css',
  shadow: { slotAssignment: 'manual' },
})
export class UiTabs implements TabsProps {
  @Element() host!: HTMLUiTabsElement;

  /**
   * The value of the selected tab. The attribute supplies the initial tab, and the property follows
   * the selection. A value that no tab has selects the first enabled tab.
   */
  @Prop({ mutable: true }) value?: string;

  /** How the tabs look: a line under the selected tab, or a filled tab in a frame. */
  @Prop() variant: TabsVariant = 'underline';

  /**
   * The direction in which the tabs follow each other, which also sets the arrow keys that move
   * between them.
   */
  @Prop() orientation: TabsOrientation = 'horizontal';

  /**
   * The accessible name of the list of tabs. Leave it out when a heading before the tabs names
   * them.
   */
  @Prop() label?: string;

  /** The user selected another tab. Setting `value` reports nothing. */
  @Event({ eventName: 'ui-value-change', cancelable: false }) change!: EventEmitter<ValueChange>;

  /** The upgraded ui-tab children, read again when a tab changes or the children do. */
  @State() private entries: readonly TabEntry[] = [];

  private observer: MutationObserver | undefined;

  private readonly watchedPanels = new WeakSet<HTMLElement>();

  connectedCallback(): void {
    registerTabs(this.host, {
      changed: () => {
        this.refresh();
      },
    });
    this.observer = new MutationObserver(() => {
      this.refresh();
    });
    this.observer.observe(this.host, { childList: true });
    this.refresh();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  // The panels take their ui-tab here, after each render, since the shadow root assigns its slots by
  // hand. Stencil types `hidden` as a boolean, so the other panels take `until-found` here too.
  componentDidRender(): void {
    const root = this.host.shadowRoot;
    if (root === null) {
      return;
    }
    const selected = this.selected();
    const panels = Array.from(root.querySelectorAll<HTMLElement>('.panel'));
    panels.forEach((panel: HTMLElement, index: number) => {
      const entry = this.entries[index];
      panel.querySelector('slot')?.assign(...(entry === undefined ? [] : [entry.element]));
      if (entry !== undefined && entry.value() === selected) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'until-found');
      }
      if (!this.watchedPanels.has(panel)) {
        this.watchedPanels.add(panel);
        panel.addEventListener('beforematch', this.onBeforeMatch);
      }
    });
  }

  render(): VNode {
    const variant = oneOf(this.variant, variantOption.options, variantOption.default);
    const orientation = oneOf(
      this.orientation,
      orientationOption.options,
      orientationOption.default,
    );
    const selected = this.selected();
    return (
      <div part="base" class={`base ${variant} ${orientation}`}>
        <div
          part="list"
          class="list"
          role="tablist"
          aria-orientation={orientation}
          aria-label={this.label === undefined || this.label === '' ? undefined : this.label}
          onKeyDown={this.onKeyDown}
        >
          {this.entries.map((entry, index) => {
            const isSelected = entry.value() === selected;
            const icon = entry.icon();
            return (
              <button
                type="button"
                role="tab"
                id={`tab-${String(index)}`}
                part="tab"
                class={`tab${isSelected ? ' selected' : ''}`}
                aria-selected={String(isSelected)}
                aria-controls={`panel-${String(index)}`}
                tabIndex={isSelected ? 0 : -1}
                disabled={entry.disabled()}
                onClick={(event) => {
                  this.select(entry.value(), 'trigger', event);
                }}
              >
                {icon === undefined || icon === '' ? null : (
                  <span part="tab-icon" class="icon" aria-hidden="true" innerHTML={icon} />
                )}
                <span part="tab-label" class="label">
                  {entry.label()}
                </span>
              </button>
            );
          })}
        </div>
        <div class="panels">
          {this.entries.map((entry, index) => (
            // A panel hidden until found keeps its box, so only the shown one takes the Tab key.
            <div
              id={`panel-${String(index)}`}
              part="panel"
              class="panel"
              role="tabpanel"
              aria-labelledby={`tab-${String(index)}`}
              tabIndex={entry.value() === selected ? 0 : -1}
            >
              <slot />
            </div>
          ))}
        </div>
      </div>
    );
  }

  private refresh(): void {
    this.entries = tabEntriesOf(this.host);
  }

  private selected(): string | undefined {
    return selectedTabValue(
      this.value,
      this.entries.map((entry) => ({ value: entry.value(), disabled: entry.disabled() })),
    );
  }

  private select(value: string, reason: TabsValueChangeReason, originalEvent: globalThis.Event) {
    if (value === this.selected()) {
      return;
    }
    this.value = value;
    this.change.emit({ value, reason, originalEvent });
  }

  private tabs(): HTMLButtonElement[] {
    return Array.from(this.host.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab') ?? []);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const tabs = this.tabs();
    const current = tabs.findIndex((tab) => tab === this.host.shadowRoot?.activeElement);
    if (current === -1) {
      return;
    }
    const next = nextTab(
      event.key,
      current,
      this.entries.map((entry) => !entry.disabled()),
      oneOf(this.orientation, orientationOption.options, orientationOption.default),
      getComputedStyle(this.host).direction === 'rtl' ? 'rtl' : 'ltr',
    );
    const entry = next === undefined ? undefined : this.entries[next];
    if (next === undefined || entry === undefined) {
      return;
    }
    event.preventDefault();
    tabs[next]?.focus();
    this.select(entry.value(), 'trigger', event);
  };

  /** The browser reveals a hidden panel on a match of find in page, and its tab is selected. */
  private readonly onBeforeMatch = (event: globalThis.Event): void => {
    const panel = event.currentTarget;
    const index = Array.from(this.host.shadowRoot?.querySelectorAll('.panel') ?? []).findIndex(
      (candidate) => candidate === panel,
    );
    const entry = this.entries[index];
    if (entry !== undefined) {
      this.select(entry.value(), 'find', event);
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTabs, keyof TabsProps>;
