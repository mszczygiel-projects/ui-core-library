/** What an Accordion asks of each of its sections. */
export interface AccordionSection {
  readonly element: HTMLElement;
  /** Whether the heading is disabled, which takes it out of the keys of the group. */
  disabled(): boolean;
  /** Closes the section without a request, as setting `open` does. */
  close(): void;
  /** Moves the focus to the button of the heading. */
  focus(): void;
}

/** What a section tells its Accordion. */
export interface AccordionChannel {
  /** The section has opened, so a group that keeps one open closes the others. */
  opened(section: AccordionSection): void;
}

const groups = new WeakMap<Element, AccordionChannel>();
const sections = new WeakMap<Element, AccordionSection>();

export function registerAccordion(element: Element, channel: AccordionChannel): void {
  groups.set(element, channel);
}

export function registerAccordionSection(section: AccordionSection): void {
  sections.set(section.element, section);
}

/** The Accordion whose default slot holds the section, if it is upgraded. */
export function accordionOf(element: Element): AccordionChannel | undefined {
  const parent = element.parentElement;
  return parent?.localName === 'ui-accordion' ? groups.get(parent) : undefined;
}

/** The upgraded sections of a group, its children in document order. */
export function accordionSectionsOf(group: Element): AccordionSection[] {
  return Array.from(group.children).flatMap((element) => {
    const section = sections.get(element);
    return section === undefined ? [] : [section];
  });
}
