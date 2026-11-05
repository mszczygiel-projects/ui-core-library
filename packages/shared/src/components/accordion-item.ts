import { defineComponent } from './component.ts';

/** The specification of AccordionItem. */
export const accordionItem = defineComponent({
  name: 'AccordionItem',
  tag: 'ui-accordion-item',
  category: 'Content',
  status: 'in-progress',
  figma: '3215:68',
  partOf: 'Accordion',
  design: {
    flags: ['open', 'disabled'],
    booleans: [],
    codeOnly: ['headingLevel'],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus of the heading. Leave it at rest in a design.',
      },
    },
  },
  summary: 'One section of an Accordion: a heading that shows and hides its content.',
  options: {},
  labels: [],
  parts: ['base', 'heading', 'trigger', 'label', 'icon', 'panel'],
  slots: [],
  events: ['ui-open-change'],
  stories: [],
  exceptions: [
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'The web component dispatches the event before the section opens or closes, and an author may cancel it, as for Popover. Find in page and a link to a text fragment open a closed section with the reason find, whatever the page answers, since the browser has already revealed the match.',
    },
    {
      items: ['headingLevel'],
      reason:
        'The level of the heading follows the outline of the page, which the component cannot know. It is a number, not a set of strings, since it is the level of an HTML heading.',
    },
  ],
});

/** The levels of the heading of a section, from h2 to h6. */
export const accordionHeadingLevels = [2, 3, 4, 5, 6] as const;

/** The level of the heading of a section. */
export type AccordionHeadingLevel = (typeof accordionHeadingLevels)[number];

/** The level of a heading when none is given or the given one is not a heading of a section. */
export const defaultAccordionHeadingLevel: AccordionHeadingLevel = 3;

/** The given level when it is a level of a section heading, the default otherwise. */
export function accordionHeadingLevel(level: unknown): AccordionHeadingLevel {
  return (
    accordionHeadingLevels.find((candidate) => candidate === level) ?? defaultAccordionHeadingLevel
  );
}

/**
 * What asked a section to open or close: a press on its heading, find in page or a link to a text
 * fragment in its closed content, or, in React, another section that opened while `multiple` is
 * off.
 */
export type AccordionItemOpenChangeReason = 'trigger' | 'find' | 'group';

/**
 * What accompanies a section that opens or closes. The package knows no browser types, so each
 * implementation names the type of the event.
 */
export interface AccordionItemOpenChangeDetails<OriginalEvent> {
  readonly reason: AccordionItemOpenChangeReason;
  /** The click, the `beforematch` event or the event that opened another section. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: the new state and what asked for it. */
export interface AccordionItemOpenChangeDetail<
  OriginalEvent,
> extends AccordionItemOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/** The props both implementations of AccordionItem share. */
export interface AccordionItemProps {
  /** The text of the heading, which names the section and its content. */
  label: string;
  /**
   * Whether the content shows. A press on the heading opens and closes it, and find in page opens
   * it on a match in its content. The closed content stays in the page, hidden.
   * @default false
   */
  open?: boolean;
  /**
   * Keeps the section as it is and removes its heading from keyboard navigation.
   * @default false
   */
  disabled?: boolean;
  /**
   * The level of the heading, from 2 to 6, which follows the outline of the page.
   * @default 3
   */
  headingLevel?: AccordionHeadingLevel;
}
