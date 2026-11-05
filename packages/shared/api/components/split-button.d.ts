import type { ButtonProps } from './button.ts';
import type { MenuActionDetail, MenuActionDetails, MenuItems, MenuOpenChangeDetail, MenuOpenChangeDetails } from './menu.ts';
export declare const splitButton: {
    readonly name: "SplitButton";
    readonly tag: "ui-split-button";
    readonly category: "Actions";
    readonly status: "done";
    readonly figma: "3203:984";
    readonly design: {
        readonly flags: readonly ["open"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["disabled", "loading", "type", "name", "value", "label", "loadingLabel", "menuLabel", "options"];
        readonly previews: {};
    };
    readonly summary: "Triggers a main action, with a button beside it that opens a menu of related actions.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["primary", "secondary", "outline", "ghost", "danger"];
            readonly default: "primary";
        };
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly type: {
            readonly options: readonly ["button", "submit", "reset"];
            readonly default: "button";
        };
    };
    readonly labels: readonly ["menu", "loading"];
    readonly parts: readonly ["base", "action", "wrapper", "content", "leading-icon", "label", "trailing-icon", "loader", "divider", "toggle", "toggle-icon"];
    readonly slots: readonly ["leading-icon", "trailing-icon"];
    readonly events: readonly ["ui-action", "ui-open-change"];
    readonly stories: readonly ["Playground", "Variants", "WithIcons", "Groups", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state as read-only properties. React exposes the native state of the main button through its ref, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["disabled", "loading"];
        readonly reason: "The component set shows each variant at rest and with its menu open. Button holds the appearance of the disabled, loading, pressed and focused states, which both halves share.";
    }, {
        readonly items: readonly ["click"];
        readonly reason: "The native click of the host or of React onClick is the main action alone. A press on the menu button or on an action of the menu stays inside the component, which reports a pick as ui-action and onAction.";
    }, {
        readonly items: readonly ["aria-expanded", "aria-haspopup"];
        readonly reason: "The menu button carries the state of its own menu, so the host passes neither attribute on. The host passes aria-label and the elements that describe it to the main button.";
    }, {
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "The web component dispatches the event before its menu opens or closes, and an author may cancel it. React keeps a controlled menu as it is instead.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon of an action is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export type SplitButtonActionDetails<OriginalEvent> = MenuActionDetails<OriginalEvent>;
export type SplitButtonActionDetail<OriginalEvent> = MenuActionDetail<OriginalEvent>;
export type SplitButtonOpenChangeDetails<OriginalEvent> = MenuOpenChangeDetails<OriginalEvent>;
export type SplitButtonOpenChangeDetail<OriginalEvent> = MenuOpenChangeDetail<OriginalEvent>;
export interface SplitButtonProps<Icon = unknown> extends ButtonProps {
    open?: boolean;
    options?: MenuItems<Icon>;
    menuLabel?: string;
    loadingLabel?: string;
}
