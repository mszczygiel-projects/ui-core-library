import { iconChevronDown } from '@mszczygiel-projects/ui-core-icons';
import {
  type AccordionHeadingLevel,
  accordionHeadingLevel,
  type AccordionItemOpenChangeReason,
  type AccordionItemProps,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';
import { nextAccordionHeading } from '@mszczygiel-projects/ui-core-shared/accordion-navigation';
import { Component, Element, Event, type EventEmitter, h, Prop, type VNode } from '@stencil/core';

import {
  accordionOf,
  type AccordionSection,
  accordionSectionsOf,
  registerAccordionSection,
} from '../internal/accordion.ts';
import type { AccordionItemOpenChange } from './events.ts';

/**
 * One section of an Accordion: a heading that shows and hides its content.
 *
 * The heading is an HTML heading of `headingLevel` that holds a button, which carries
 * `aria-expanded` and controls the panel, a region named by the heading. A press on the button
 * dispatches the cancelable `ui-open-change`, and the reflected `open` attribute follows the
 * section. The content of a closed section stays in the page as `hidden="until-found"`, so find in
 * page and a link to a text fragment open it. Arrow Down and Arrow Up move the focus between the
 * headings of the Accordion, Home and End to the first and last.
 *
 * @slot - The content of the section, in the page whether it is open or closed.
 * @part base - The wrapper of the heading and the panel.
 * @part heading - The HTML heading.
 * @part trigger - The button of the heading.
 * @part label - The text of the heading.
 * @part icon - The chevron, which turns over when the section opens.
 * @part panel - The region that holds the content.
 */
@Component({ tag: 'ui-accordion-item', styleUrl: 'accordion-item.css', shadow: true })
export class UiAccordionItem implements AccordionItemProps {
  @Element() host!: HTMLUiAccordionItemElement;

  /** The text of the heading, which names the section and its content. */
  @Prop() label = '';

  /** Whether the content shows. The attribute supplies the initial state and follows the section. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Keeps the section as it is and removes its heading from keyboard navigation. */
  @Prop({ reflect: true }) disabled = false;

  /** The level of the heading, from 2 to 6, which follows the outline of the page. */
  @Prop() headingLevel: AccordionHeadingLevel = 3;

  /**
   * The user asked to open or close the section. Canceling a press keeps the section as it is; find
   * in page reveals the content whatever the page answers.
   */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<AccordionItemOpenChange>;

  private readonly section: AccordionSection = {
    element: this.host,
    disabled: () => this.disabled,
    close: () => {
      this.open = false;
    },
    focus: () => {
      this.trigger()?.focus();
    },
  };

  connectedCallback(): void {
    registerAccordionSection(this.section);
  }

  // Stencil types `hidden` as a boolean, so the panel takes `until-found` here, after each render.
  // `hidden="until-found"` is a decided newer feature: a browser without it hides the panel
  // plainly, and find in page skips the content, which stays in the page.
  componentDidRender(): void {
    if (this.open) {
      this.panel?.removeAttribute('hidden');
    } else {
      this.panel?.setAttribute('hidden', 'until-found');
    }
  }

  render(): VNode {
    const Heading = `h${String(accordionHeadingLevel(this.headingLevel))}`;
    return (
      <div part="base" class={`base${this.open ? ' open' : ''}`}>
        <Heading part="heading" class="heading">
          <button
            type="button"
            id="trigger"
            part="trigger"
            class="trigger"
            aria-expanded={String(this.open)}
            aria-controls="panel"
            disabled={this.disabled}
            onClick={this.onClick}
            onKeyDown={this.onKeyDown}
          >
            <span part="label" class="label">
              {this.label}
            </span>
            <span part="icon" class="icon" aria-hidden="true" innerHTML={iconChevronDown} />
          </button>
        </Heading>
        <div
          id="panel"
          part="panel"
          class="panel"
          role="region"
          aria-labelledby="trigger"
          ref={this.watchPanel}
        >
          <div class="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }

  private trigger(): HTMLButtonElement | null {
    return this.host.shadowRoot?.querySelector<HTMLButtonElement>('.trigger') ?? null;
  }

  /** Asks to open or close the section; only a press can be refused. */
  private request(
    open: boolean,
    reason: AccordionItemOpenChangeReason,
    originalEvent: globalThis.Event,
  ): void {
    if (this.open === open) {
      return;
    }
    const event = this.openChange.emit({ value: open, reason, originalEvent });
    if (event.defaultPrevented && reason === 'trigger') {
      return;
    }
    this.open = open;
    if (open) {
      accordionOf(this.host)?.opened(this.section);
    }
  }

  private readonly onClick = (event: MouseEvent): void => {
    if (!this.disabled) {
      this.request(!this.open, 'trigger', event);
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const group = this.host.parentElement;
    if (group?.localName !== 'ui-accordion') {
      return;
    }
    const sections = accordionSectionsOf(group);
    const next = nextAccordionHeading(
      event.key,
      sections.indexOf(this.section),
      sections.map((section) => !section.disabled()),
    );
    if (next !== undefined) {
      event.preventDefault();
      sections[next]?.focus();
    }
  };

  /** The browser reveals a closed panel on a match of find in page, and the section follows. */
  private panel: HTMLElement | null = null;

  private readonly watchPanel = (element: HTMLElement | undefined): void => {
    if (this.panel === element) {
      return;
    }
    this.panel?.removeEventListener('beforematch', this.onBeforeMatch);
    this.panel = element ?? null;
    this.panel?.addEventListener('beforematch', this.onBeforeMatch);
  };

  private readonly onBeforeMatch = (event: globalThis.Event): void => {
    this.request(true, 'find', event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiAccordionItem, keyof AccordionItemProps>;
