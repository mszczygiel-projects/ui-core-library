import {
  badge,
  type BadgeProps,
  type BadgeShape,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from '@mszczygiel-projects/ui-core-shared/badge';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { followAttribute } from '../internal/follow-attribute.ts';
import { hasAssignedContent, hasAssignedText } from '../internal/slots.ts';

const { options } = badge;

/**
 * Marks a status, a category or a count with a short label, an icon or both.
 *
 * The badge is not interactive. Its text names it; a badge with only an icon becomes an image
 * named by `label`. The host belongs to the page: the component writes no role or ARIA attribute
 * on it, and an `aria-label` that the page writes there names the image instead of `label`.
 *
 * @slot - The text of the badge.
 * @slot icon - A decorative icon before the text, or the only content of the badge.
 * @part base - The surface of the badge, its fill and corners.
 * @part icon - The box that sizes the icon.
 * @part label - The text of the badge.
 */
@Component({ tag: 'ui-badge', styleUrl: 'badge.css', shadow: true })
export class UiBadge implements BadgeProps {
  @Element() host!: HTMLUiBadgeElement;

  /** The meaning the badge carries. */
  @Prop() tone: BadgeTone = 'neutral';

  /** The emphasis of the badge. */
  @Prop() variant: BadgeVariant = 'solid';

  /** The size, which follows the density. */
  @Prop() size: BadgeSize = 'medium';

  /** The corners of the badge. */
  @Prop() shape: BadgeShape = 'rounded';

  /**
   * The accessible name of a badge that shows only an icon. A badge with text is named by its
   * text, and an author's `aria-label` wins.
   */
  @Prop() label?: string;

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  @State() private hasIcon = false;

  @State() private hasText = false;

  private stopFollowing: (() => void) | undefined;

  connectedCallback(): void {
    this.stopFollowing = followAttribute(this.host, 'aria-label', (value) => {
      this.authorLabel = value;
    });
  }

  disconnectedCallback(): void {
    this.stopFollowing?.();
    this.stopFollowing = undefined;
  }

  render(): VNode {
    const tone = oneOf(this.tone, options.tone.options, options.tone.default);
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const shape = oneOf(this.shape, options.shape.options, options.shape.default);
    const iconOnly = this.hasIcon && !this.hasText;
    const name = this.authorLabel ?? this.label;
    const named = iconOnly && typeof name === 'string' && name !== '';
    return (
      <span
        part="base"
        class={`base ${tone} ${variant} ${size} ${shape}${iconOnly ? ' icon-only' : ''}`}
        role={named ? 'img' : undefined}
        aria-label={named ? name : undefined}
      >
        <span part="icon" class="icon" aria-hidden="true" hidden={!this.hasIcon}>
          <slot name="icon" onSlotchange={this.onIconSlotChange} />
        </span>
        <span part="label" class="label" hidden={iconOnly}>
          <slot onSlotchange={this.onTextSlotChange} />
        </span>
      </span>
    );
  }

  private readonly onIconSlotChange = (event: Event): void => {
    this.hasIcon = hasAssignedContent(event);
  };

  private readonly onTextSlotChange = (event: Event): void => {
    this.hasText = hasAssignedText(event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiBadge, keyof BadgeProps>;
