import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import {
  breadcrumbs,
  type BreadcrumbsItem,
  type BreadcrumbsProps,
  type BreadcrumbsSeparator,
  type BreadcrumbsSize,
} from '@mszczygiel-projects/ui-core-shared/breadcrumbs';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
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

import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { BreadcrumbsNavigate } from './events.ts';

const { options } = breadcrumbs;

declare global {
  interface HTMLElementEventMap {
    'ui-navigate': CustomEvent<BreadcrumbsNavigate>;
  }
}

/** Whether a value is a list, which `Array.isArray` alone would widen to `any[]`. */
function isList(value: unknown): value is readonly BreadcrumbsItem<string>[] {
  return Array.isArray(value);
}

/**
 * A trail of links from the top of a site down to the current page.
 *
 * A navigation landmark holds an ordered list of the items. The last item is the current page:
 * text with `aria-current="page"`, never a link. An item with `href` is a link, and one without
 * is text. A press on a link dispatches the cancelable `ui-navigate`; a page with client-side
 * routing cancels it and moves on its own. In a container narrower than `breakpoint/sm` the
 * items before the last two hide behind an ellipsis; they stay in the accessibility tree, so a
 * screen reader still reads the whole trail. The separators are decorative and follow the
 * direction of the text. An `aria-label` that the page writes on the host names the navigation
 * instead of the label.
 *
 * @part base - The navigation landmark, which is the container of the width queries.
 * @part list - The ordered list of the items.
 * @part item - One item of the list, with its separator.
 * @part link - The link of an item with an address.
 * @part text - An item without an address that is not the current page.
 * @part current - The current page, the last item.
 * @part item-icon - The box of the decorative icon of an item.
 * @part item-label - The text of an item.
 * @part separator - The decorative mark after an item.
 * @part ellipsis - The mark that stands for the hidden items in a narrow container.
 */
@Component({ tag: 'ui-breadcrumbs', styleUrl: 'breadcrumbs.css', shadow: true })
export class UiBreadcrumbs implements BreadcrumbsProps<string> {
  @Element() host!: HTMLUiBreadcrumbsElement;

  /**
   * The steps from the top of the site to the current page, which is the last one. Each icon is
   * an SVG string of the icon package. A property only, since an attribute cannot hold a list.
   */
  @Prop() items: readonly BreadcrumbsItem<string>[] = [];

  /** The accessible name of the navigation, falling back to `labels.breadcrumbs.label`. */
  @Prop() label?: string;

  /** The size of the text, which follows the density. */
  @Prop() size: BreadcrumbsSize = 'medium';

  /** The mark between two items, which follows the direction of the text. */
  @Prop() separator: BreadcrumbsSeparator = 'chevron';

  // Stencil events are cancelable by default.
  /**
   * The user pressed the link of an item. Cancel it to keep the browser from following the link,
   * as a page with client-side routing does.
   */
  @Event({ eventName: 'ui-navigate' }) navigate!: EventEmitter<BreadcrumbsNavigate>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  private stopFollowing: (() => void)[] = [];

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  render(): VNode {
    const size = oneOf(this.size, options.size.options, options.size.default);
    const separator = oneOf(this.separator, options.separator.options, options.separator.default);
    // A page may set anything as a property, so a value that is not a list renders no items.
    const items: readonly BreadcrumbsItem<string>[] = isList(this.items) ? this.items : [];
    // The items before the last two hide in a narrow container, so a trail of two never does.
    const hidden = Math.max(items.length - 2, 0);
    return (
      <nav
        part="base"
        class={`base ${size} ${separator}`}
        aria-label={this.authorLabel ?? this.label ?? this.config.labels.breadcrumbs.label}
      >
        <ol part="list" class="list">
          {hidden > 0 && (
            <li part="item" class="item ellipsis-item" aria-hidden="true">
              <span part="ellipsis" class="ellipsis" />
              {this.renderSeparator(separator)}
            </li>
          )}
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li part="item" class={`item${index < hidden ? ' collapsible' : ''}`}>
                {this.renderItem(item, index, last)}
                {!last && this.renderSeparator(separator)}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  private renderItem(item: BreadcrumbsItem<string>, index: number, last: boolean): VNode {
    const hasIcon = typeof item.icon === 'string' && item.icon !== '';
    const content = [
      hasIcon && <span part="item-icon" class="icon" aria-hidden="true" innerHTML={item.icon} />,
      // An icon alone keeps its label as the name, out of sight.
      <span part="item-label" class={`label${hasIcon && item.iconOnly === true ? ' hidden' : ''}`}>
        {item.label}
      </span>,
    ];
    if (last) {
      return (
        <span part="current" class="current" aria-current="page">
          {content}
        </span>
      );
    }
    if (typeof item.href !== 'string' || item.href === '') {
      return (
        <span part="text" class="text">
          {content}
        </span>
      );
    }
    return (
      <a
        part="link"
        class="link"
        href={item.href}
        onClick={(event) => {
          this.onLinkClick(event, item, index);
        }}
      >
        {content}
      </a>
    );
  }

  private renderSeparator(separator: BreadcrumbsSeparator): VNode {
    return separator === 'chevron' ? (
      <span part="separator" class="separator" aria-hidden="true" innerHTML={iconChevronRight} />
    ) : (
      <span part="separator" class="separator" aria-hidden="true" />
    );
  }

  /** A canceled event keeps the browser from following the link. */
  private onLinkClick(event: MouseEvent, item: BreadcrumbsItem<string>, index: number): void {
    const emitted = this.navigate.emit({ item, index, originalEvent: event });
    if (emitted.defaultPrevented) {
      event.preventDefault();
    }
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiBreadcrumbs, keyof BreadcrumbsProps<string>>;
