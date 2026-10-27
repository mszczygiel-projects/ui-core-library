import { type OptionOf } from './component.ts';
export declare const notification: {
    readonly name: "Notification";
    readonly tag: "ui-notification";
    readonly category: "Feedback";
    readonly status: "in-progress";
    readonly figma: "1731:2969";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly ["hasLeadingIcon", "dismissible"];
        readonly codeOnly: readonly ["announce"];
        readonly previews: {
            readonly description: {
                readonly options: readonly ["true", "false"];
                readonly default: "true";
                readonly note: "Shows or hides the description below the heading. Code shows it when the notification has content.";
            };
        };
    };
    readonly summary: "Tells the user about the state of the page or the result of an action, in one of the feedback tones.";
    readonly options: {
        readonly tone: {
            readonly options: readonly ["info", "success", "warning", "error"];
            readonly default: "info";
        };
        readonly variant: {
            readonly options: readonly ["solid", "subtle"];
            readonly default: "solid";
        };
    };
    readonly labels: readonly ["dismiss"];
    readonly parts: readonly ["base", "content", "header", "icon", "heading", "description", "dismiss"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-dismiss"];
    readonly stories: readonly ["Playground", "Variants", "Dismissible", "Announced", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component is form-associated only to follow a disabled fieldset, as the native dismiss button of React does. It submits nothing and exposes no form API.";
    }];
};
export type NotificationTone = OptionOf<typeof notification, 'tone'>;
export type NotificationVariant = OptionOf<typeof notification, 'variant'>;
export type NotificationRole = 'status' | 'alert' | undefined;
export declare function notificationRole(tone: NotificationTone, announce: boolean): NotificationRole;
export interface NotificationDismissDetail<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface NotificationProps {
    tone?: NotificationTone;
    variant?: NotificationVariant;
    heading?: string;
    hasLeadingIcon?: boolean;
    dismissible?: boolean;
    dismissLabel?: string;
    announce?: boolean;
}
