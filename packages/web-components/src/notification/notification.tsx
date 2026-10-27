import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconCheck, iconClose, iconDanger, iconInfo } from '@mszczygiel-projects/ui-core-icons';
import {
  notification,
  type NotificationProps,
  notificationRole,
  type NotificationTone,
  type NotificationVariant,
} from '@mszczygiel-projects/ui-core-shared/notification';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
  Watch,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { hasAssignedText, slotHasText } from '../internal/slots.ts';
import type { NotificationDismiss } from './events.ts';

const { options } = notification;

/** The icon of each tone, a cue that does not rest on colour alone. */
const toneIcons: Record<NotificationTone, string> = {
  info: iconInfo,
  success: iconCheck,
  warning: iconDanger,
  error: iconDanger,
};

declare global {
  interface HTMLElementEventMap {
    'ui-dismiss': CustomEvent<NotificationDismiss>;
  }
}

/**
 * Tells the user about the state of the page or the result of an action, in one of the feedback
 * tones.
 *
 * The heading gives the message in one line, and the content describes it further; links in it
 * stay links. A notification with `announce` is a live region, an alert for an error and a status
 * for any other tone. It shows its content one frame after it is connected, so that a screen
 * reader reads a notification that the page inserts. A dismissible notification adds a button
 * named by the dismiss label and the heading, which dispatches `ui-dismiss`; the page removes the
 * notification. The host belongs to the page: the component reflects no prop and writes no role
 * or ARIA attribute on it. The host is form-associated only to follow a disabled fieldset, which
 * disables the dismiss button as it does a native one; it submits nothing.
 *
 * @slot - The description below the heading.
 * @part base - The surface of the notification, its fill, border and corners.
 * @part content - The heading and the description, and the live region of an announced notification.
 * @part header - The row of the icon and the heading.
 * @part icon - The icon of the tone.
 * @part heading - The heading.
 * @part description - The box of the description.
 * @part dismiss - The button that asks to remove the notification.
 */
@Component({
  tag: 'ui-notification',
  styleUrl: 'notification.css',
  shadow: true,
  formAssociated: true,
})
export class UiNotification implements NotificationProps {
  @Element() host!: HTMLUiNotificationElement;

  @AttachInternals() internals!: ElementInternals;

  /** The feedback the notification gives. */
  @Prop() tone: NotificationTone = 'info';

  /** The emphasis of the notification. */
  @Prop() variant: NotificationVariant = 'solid';

  /** The message in one short line. The content of the notification describes it further. */
  @Prop() heading?: string;

  /** Shows the icon of the tone before the heading. */
  @Prop() hasLeadingIcon = false;

  /** Shows a button that asks to remove the notification. */
  @Prop() dismissible = false;

  /**
   * The word that names the dismiss button before the heading, falling back to
   * `labels.notification.dismiss`.
   */
  @Prop() dismissLabel?: string;

  /**
   * Makes the notification a live region, so that a screen reader reads it when it appears or
   * changes.
   */
  @Prop() announce = false;

  /** The user asked to remove the notification with its dismiss button. */
  @Event({ eventName: 'ui-dismiss' }) dismiss!: EventEmitter<NotificationDismiss>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  @State() private hasDescription = false;

  /** Whether the content shows: at once, or for a live region from the frame after connection. */
  @State() private revealed = true;

  /** Whether a disabled fieldset around the host disables its dismiss button. */
  @State() private formDisabled = false;

  private stopFollowing: (() => void) | undefined;

  private revealFrame: number | undefined;

  /** Follows edits of the text nodes in the light DOM, which fire no `slotchange`. */
  private readonly textObserver = new MutationObserver(() => {
    const slot = this.host.shadowRoot?.querySelector('slot:not([name])');
    if (slot instanceof HTMLSlotElement) {
      this.hasDescription = slotHasText(slot);
    }
  });

  connectedCallback(): void {
    this.stopFollowing = followConfig((config) => {
      this.config = config;
    });
    this.textObserver.observe(this.host, { characterData: true, subtree: true });
    this.reveal();
  }

  disconnectedCallback(): void {
    this.stopFollowing?.();
    this.stopFollowing = undefined;
    this.textObserver.disconnect();
    if (this.revealFrame !== undefined) {
      cancelAnimationFrame(this.revealFrame);
      this.revealFrame = undefined;
    }
  }

  /**
   * Takes the disabled state of a fieldset around the host. The browser calls it only when that
   * state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  @Watch('announce')
  protected announceChanged(): void {
    this.reveal();
  }

  render(): VNode {
    const tone = oneOf(this.tone, options.tone.options, options.tone.default);
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const hasHeading = this.heading !== undefined && this.heading !== '';
    return (
      <div part="base" class={`base ${tone} ${variant}`}>
        <div part="content" class="content" role={notificationRole(tone, this.announce)}>
          <div part="header" class="header" hidden={!this.revealed}>
            {this.hasLeadingIcon && (
              <span part="icon" class="icon" aria-hidden="true" innerHTML={toneIcons[tone]} />
            )}
            <span id="heading" part="heading" class="heading" hidden={!hasHeading}>
              {this.heading}
            </span>
          </div>
          <div
            part="description"
            class="description"
            hidden={!this.revealed || !this.hasDescription}
          >
            <slot onSlotchange={this.onSlotChange} />
          </div>
        </div>
        {this.dismissible && (
          <button
            part="dismiss"
            class="dismiss"
            type="button"
            disabled={this.formDisabled}
            aria-labelledby={hasHeading ? 'dismiss-label heading' : 'dismiss-label'}
            onClick={this.onDismiss}
          >
            <span id="dismiss-label" hidden>
              {this.dismissLabel ?? this.config.labels.notification.dismiss}
            </span>
            <span class="dismiss-icon" aria-hidden="true" innerHTML={iconClose} />
          </button>
        )}
      </div>
    );
  }

  /**
   * A live region announces a change of its content, not content it already had when it appeared.
   * So an announced notification renders the region empty and shows its content a frame later.
   */
  private reveal(): void {
    if (this.revealFrame !== undefined) {
      cancelAnimationFrame(this.revealFrame);
      this.revealFrame = undefined;
    }
    if (!this.announce) {
      this.revealed = true;
      return;
    }
    this.revealed = false;
    this.revealFrame = requestAnimationFrame(() => {
      this.revealFrame = undefined;
      this.revealed = true;
    });
  }

  private readonly onSlotChange = (event: Event): void => {
    this.hasDescription = hasAssignedText(event);
  };

  private readonly onDismiss = (event: MouseEvent): void => {
    this.dismiss.emit({ originalEvent: event });
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiNotification, keyof NotificationProps>;
