import type { TabProps } from '@mszczygiel-projects/ui-core-shared/tab';
import { Component, Element, h, Prop, type VNode, Watch } from '@stencil/core';

import { registerTab, type TabEntry, tabsOf } from '../internal/tabs.ts';

/**
 * One tab of Tabs: its label, an optional icon, and the content of its panel.
 *
 * It holds the content of its panel, in the page whether its tab is selected or not. The Tabs
 * around it renders its tab from `label`, `icon` and `disabled`, and places the element in the
 * panel of that tab.
 *
 * @slot - The content of the panel.
 */
@Component({ tag: 'ui-tab', styleUrl: 'tab.css', shadow: true })
export class UiTab implements TabProps<string> {
  @Element() host!: HTMLUiTabElement;

  /** The value that selects the tab, unique among the tabs of a Tabs. */
  @Prop() value = '';

  /** The text of the tab, which names the tab and its panel. */
  @Prop() label = '';

  /** A decorative icon before the label, an SVG string of the icon package. */
  @Prop() icon?: string;

  /** Keeps the tab from being selected and takes it out of the arrow keys. */
  @Prop({ reflect: true }) disabled = false;

  private readonly entry: TabEntry = {
    element: this.host,
    value: () => this.value,
    label: () => this.label,
    icon: () => this.icon,
    disabled: () => this.disabled,
  };

  connectedCallback(): void {
    registerTab(this.entry);
    tabsOf(this.host)?.changed();
  }

  @Watch('value')
  @Watch('label')
  @Watch('icon')
  @Watch('disabled')
  protected propChanged(): void {
    tabsOf(this.host)?.changed();
  }

  render(): VNode {
    return <slot />;
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTab, keyof TabProps>;
