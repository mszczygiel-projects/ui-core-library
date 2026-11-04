export declare const accordion: {
    readonly name: "Accordion";
    readonly tag: "ui-accordion";
    readonly category: "Content";
    readonly status: "in-progress";
    readonly figma: "3215:70";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["multiple"];
        readonly previews: {};
    };
    readonly summary: "A stack of sections whose headings show and hide their content.";
    readonly options: {};
    readonly labels: readonly [];
    readonly parts: readonly ["base"];
    readonly slots: readonly [];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Multiple", "WithDisabledItem", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["ui-open-change"];
        readonly reason: "Each AccordionItem reports its own request to open or close. When one opens and multiple is off, the group closes the others by setting their open, which the web component reports as nothing, since setting open reports nothing. React calls onOpenChange of each closed item with the reason group, because a controlled item stays open until its parent agrees.";
    }];
};
export interface AccordionProps {
    multiple?: boolean;
}
