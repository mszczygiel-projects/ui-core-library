import { type OptionOf } from './component.ts';
export declare const dialog: {
    readonly name: "Dialog";
    readonly tag: "ui-dialog";
    readonly category: "Overlays";
    readonly status: "done";
    readonly figma: "2216:3109";
    readonly design: {
        readonly flags: readonly ["hideCloseButton"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["open", "alert", "label", "closeLabel", "dragToDismiss"];
        readonly previews: {
            readonly hasDescription: {
                readonly options: readonly ["true", "false"];
                readonly default: "true";
                readonly note: "Shows or hides the description below the heading. Code shows it when the dialog has a description.";
            };
            readonly hasFooter: {
                readonly options: readonly ["true", "false"];
                readonly default: "true";
                readonly note: "Shows or hides the row of actions. Code shows it when the footer slot has content.";
            };
        };
    };
    readonly summary: "A modal window over the page that asks the user to read, decide or enter something before going on.";
    readonly options: {
        readonly size: {
            readonly options: readonly ["small", "medium", "large", "fullscreen"];
            readonly default: "medium";
        };
    };
    readonly labels: readonly ["close"];
    readonly parts: readonly ["base", "grabber", "header", "heading", "description", "close", "body", "footer"];
    readonly slots: readonly ["footer"];
    readonly events: readonly ["ui-open-change"];
    readonly stories: readonly ["Playground", "Sizes", "Alert", "WithForm", "Draggable", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["size"];
        readonly reason: "Besides the three sizes of the vocabulary, fullscreen fills the window. The size of a dialog is the width of its window, not a density, so it is one prop.";
    }, {
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "A modal closes on its own at the request of the user, so the web component dispatches the event before it closes, and an author may cancel it, for example to keep a form with unsaved changes. React keeps a controlled dialog open instead.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "A dialog holds form controls but is none, so it is not form-associated.";
    }];
};
export type DialogSize = OptionOf<typeof dialog, 'size'>;
export type OverlayCloseReason = 'escape' | 'backdrop' | 'close-button' | 'drag' | 'form';
export interface OverlayOpenChangeDetails<OriginalEvent> {
    readonly reason: OverlayCloseReason;
    readonly returnValue: string;
    readonly originalEvent: OriginalEvent;
}
export interface OverlayOpenChangeDetail<OriginalEvent> extends OverlayOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface OverlayProps {
    open?: boolean;
    hideCloseButton?: boolean;
    closeLabel?: string;
    dragToDismiss?: boolean;
}
export interface DialogProps extends OverlayProps {
    size?: DialogSize;
    alert?: boolean;
    heading?: string;
    description?: string;
    label?: string;
}
