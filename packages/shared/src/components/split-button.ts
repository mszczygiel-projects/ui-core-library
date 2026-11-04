import type { ButtonProps } from './button.ts';
import { button } from './button.ts';
import { defineComponent } from './component.ts';
import type {
  MenuActionDetail,
  MenuActionDetails,
  MenuItems,
  MenuOpenChangeDetail,
  MenuOpenChangeDetails,
} from './menu.ts';

/** The specification of SplitButton. */
export const splitButton = defineComponent({
  name: 'SplitButton',
  tag: 'ui-split-button',
  category: 'Actions',
  status: 'in-progress',
  figma: '3203:984',
  design: {
    flags: ['open'],
    booleans: [],
    codeOnly: [
      'disabled',
      'loading',
      'type',
      'name',
      'value',
      'label',
      'loadingLabel',
      'menuLabel',
      'options',
    ],
    previews: {},
  },
  summary: 'Triggers a main action, with a button beside it that opens a menu of related actions.',
  options: {
    variant: button.options.variant,
    size: button.options.size,
    type: button.options.type,
  },
  labels: ['menu', 'loading'],
  parts: [
    'base',
    'action',
    'wrapper',
    'content',
    'leading-icon',
    'label',
    'trailing-icon',
    'loader',
    'divider',
    'toggle',
    'toggle-icon',
  ],
  slots: ['leading-icon', 'trailing-icon'],
  events: ['ui-action', 'ui-open-change'],
  stories: ['Playground', 'Variants', 'WithIcons', 'Groups', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state as read-only properties. React exposes the native state of the main button through its ref, and its form prop is the native form ID attribute.',
    },
    {
      items: ['disabled', 'loading'],
      reason:
        'The component set shows each variant at rest and with its menu open. Button holds the appearance of the disabled, loading, pressed and focused states, which both halves share.',
    },
    {
      items: ['click'],
      reason:
        'The native click of the host or of React onClick is the main action alone. A press on the menu button or on an action of the menu stays inside the component, which reports a pick as ui-action and onAction.',
    },
    {
      items: ['aria-expanded', 'aria-haspopup'],
      reason:
        'The menu button carries the state of its own menu, so the host passes neither attribute on. The host passes aria-label and the elements that describe it to the main button.',
    },
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'The web component dispatches the event before its menu opens or closes, and an author may cancel it. React keeps a controlled menu as it is instead.',
    },
    {
      items: ['icon'],
      reason:
        'The icon of an action is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.',
    },
  ],
});

/** What accompanies the pick of an action from the menu of a split button. */
export type SplitButtonActionDetails<OriginalEvent> = MenuActionDetails<OriginalEvent>;

/** The detail of `ui-action`: the value of the picked action and the event that picked it. */
export type SplitButtonActionDetail<OriginalEvent> = MenuActionDetail<OriginalEvent>;

/** What accompanies the menu of a split button that opens or closes at the request of the user. */
export type SplitButtonOpenChangeDetails<OriginalEvent> = MenuOpenChangeDetails<OriginalEvent>;

/** The detail of `ui-open-change`: the new state of the menu and what asked for it. */
export type SplitButtonOpenChangeDetail<OriginalEvent> = MenuOpenChangeDetail<OriginalEvent>;

/**
 * The props both implementations of SplitButton share. `Icon` is the type of the icons of the
 * actions of the menu, which each implementation names.
 */
export interface SplitButtonProps<Icon = unknown> extends ButtonProps {
  /**
   * Whether the menu is open. A press on the menu button opens and closes it; Escape, a pick, a
   * press outside and the focus leaving close it.
   * @default false
   */
  open?: boolean;
  /**
   * The related actions of the menu, alone or in groups that a rule separates. Without an enabled
   * action, the menu button is disabled.
   */
  options?: MenuItems<Icon>;
  /** The name of the menu button and its menu, falling back to `labels.splitButton.menu`. */
  menuLabel?: string;
  /** The description of the loading state, falling back to `labels.splitButton.loading`. */
  loadingLabel?: string;
}
