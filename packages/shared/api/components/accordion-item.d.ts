export declare const accordionItem: {
    readonly name: "AccordionItem";
    readonly tag: "ui-accordion-item";
    readonly category: "Content";
    readonly status: "in-progress";
    readonly figma: "3215:68";
    readonly partOf: "Accordion";
    readonly design: {
        readonly flags: readonly ["open", "disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["headingLevel"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus of the heading. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "One section of an Accordion: a heading that shows and hides its content.";
    readonly options: {};
    readonly labels: readonly [];
    readonly parts: readonly ["base", "heading", "trigger", "label", "icon", "panel"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-open-change"];
    readonly stories: readonly [];
    readonly exceptions: readonly [{
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "The web component dispatches the event before the section opens or closes, and an author may cancel it, as for Popover. Find in page and a link to a text fragment open a closed section with the reason find, whatever the page answers, since the browser has already revealed the match.";
    }, {
        readonly items: readonly ["headingLevel"];
        readonly reason: "The level of the heading follows the outline of the page, which the component cannot know. It is a number, not a set of strings, since it is the level of an HTML heading.";
    }];
};
export declare const accordionHeadingLevels: readonly [2, 3, 4, 5, 6];
export type AccordionHeadingLevel = (typeof accordionHeadingLevels)[number];
export declare const defaultAccordionHeadingLevel: AccordionHeadingLevel;
export declare function accordionHeadingLevel(level: unknown): AccordionHeadingLevel;
export type AccordionItemOpenChangeReason = 'trigger' | 'find' | 'group';
export interface AccordionItemOpenChangeDetails<OriginalEvent> {
    readonly reason: AccordionItemOpenChangeReason;
    readonly originalEvent: OriginalEvent;
}
export interface AccordionItemOpenChangeDetail<OriginalEvent> extends AccordionItemOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface AccordionItemProps {
    label: string;
    open?: boolean;
    disabled?: boolean;
    headingLevel?: AccordionHeadingLevel;
}
