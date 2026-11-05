import { type OptionOf } from './component.ts';
import type { OverlayProps } from './dialog.ts';
export declare const drawer: {
    readonly name: "Drawer";
    readonly tag: "ui-drawer";
    readonly category: "Overlays";
    readonly status: "done";
    readonly figma: "2381:2696";
    readonly design: {
        readonly flags: readonly ["hideCloseButton"];
        readonly booleans: readonly ["dragToDismiss"];
        readonly codeOnly: readonly ["open", "label", "closeLabel"];
        readonly previews: {};
    };
    readonly summary: "A modal panel at an edge of the window that holds secondary content, such as filters, navigation or details.";
    readonly options: {
        readonly placement: {
            readonly options: readonly ["start", "end", "bottom"];
            readonly default: "end";
        };
    };
    readonly labels: readonly ["close"];
    readonly parts: readonly ["base", "grabber", "header", "close", "body"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-open-change"];
    readonly stories: readonly ["Playground", "Placements", "WithForm", "Draggable", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "A modal closes on its own at the request of the user, so the web component dispatches the event before it closes, and an author may cancel it, for example to keep a form with unsaved changes. React keeps a controlled drawer open instead.";
    }, {
        readonly items: readonly ["aria-labelledby"];
        readonly reason: "Nothing visible names a drawer, so label is required. React may name it from a heading of the content with aria-labelledby instead; a reference by id cannot cross the shadow root of the web component.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "A drawer holds form controls but is none, so it is not form-associated.";
    }];
};
export type DrawerPlacement = OptionOf<typeof drawer, 'placement'>;
export interface DrawerProps extends OverlayProps {
    placement?: DrawerPlacement;
    label?: string;
}
