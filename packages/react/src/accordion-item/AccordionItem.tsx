'use client';

import { iconChevronDown } from '@mszczygiel-projects/ui-core-icons';
import {
  accordionHeadingLevel,
  type AccordionItemOpenChangeDetails as SharedOpenChangeDetails,
  type AccordionItemOpenChangeReason,
  type AccordionItemProps as SharedAccordionItemProps,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';
import { nextAccordionHeading } from '@mszczygiel-projects/ui-core-shared/accordion-navigation';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { AccordionContext } from '../accordion/Accordion.tsx';
import { classNames } from '../internal/class-names.ts';

export type {
  AccordionHeadingLevel,
  AccordionItemOpenChangeReason,
} from '@mszczygiel-projects/ui-core-shared/accordion-item';

/** The event that asked the section to open or close, before React wraps it. */
export type AccordionItemOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** The props of AccordionItem. Other attributes of a `div` and ref go to its root element. */
export interface AccordionItemProps
  extends
    SharedAccordionItemProps,
    Omit<ComponentPropsWithRef<'div'>, keyof SharedAccordionItemProps | 'children'> {
  /** The initial state of an uncontrolled section. */
  defaultOpen?: boolean;
  /** The content of the section, in the page whether it is open or closed. */
  children?: ReactNode;
  /** Called on each request to open or close, with the new state and what asked for it. */
  onOpenChange?: (open: boolean, details: AccordionItemOpenChangeDetails) => void;
}

const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

const TRIGGERS =
  ':scope > .ui-accordion-item > .ui-accordion-item__heading > .ui-accordion-item__trigger';

/**
 * One section of an Accordion: a heading that shows and hides its content.
 *
 * The heading is an HTML heading of `headingLevel` that holds a button, which carries
 * `aria-expanded` and controls the panel, a region named by the heading. A controlled section
 * follows `open`, and `onOpenChange` reports each request. The content of a closed section stays
 * in the page as `hidden="until-found"`, so find in page and a link to a text fragment open it.
 * Arrow Down and Arrow Up move the focus between the headings of the Accordion, Home and End to
 * the first and last.
 */
export function AccordionItem({
  label,
  open,
  defaultOpen = false,
  disabled = false,
  headingLevel = 3,
  onOpenChange,
  className,
  children,
  ...rest
}: AccordionItemProps) {
  const group = use(AccordionContext);
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  // The browser shows the content of a match before the page answers, so a controlled section that
  // keeps `open` false still shows it, until it closes or `open` changes.
  const [found, setFound] = useState(false);
  const [followedOpen, setFollowedOpen] = useState(open);
  if (open !== followedOpen) {
    setFollowedOpen(open);
    setFound(false);
  }
  const isOpen = found || (open ?? uncontrolledOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openingRef = useRef<Event | null>(null);
  const Heading = `h${String(accordionHeadingLevel(headingLevel))}` as
    'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const request = (next: boolean, reason: AccordionItemOpenChangeReason, originalEvent: Event) => {
    if (next === isOpen) {
      return;
    }
    setUncontrolledOpen(next);
    setFound(next && reason === 'find');
    openingRef.current = next ? originalEvent : null;
    onOpenChange?.(next, { reason, originalEvent });
  };

  const requestRef = useRef(request);
  useBrowserLayoutEffect(() => {
    requestRef.current = request;
  });

  // The others close once the section has opened, so that a controlled parent that keeps it closed
  // keeps them open, as a canceled request does in the web component. The request waits for a
  // parent that opens the section later, after an asynchronous answer.
  useBrowserLayoutEffect(() => {
    const opening = openingRef.current;
    if (isOpen && opening !== null) {
      openingRef.current = null;
      group?.opened(id, opening);
    }
  });

  useEffect(() => {
    return group?.register(id, {
      close: (originalEvent) => {
        requestRef.current(false, 'group', originalEvent);
      },
    });
  }, [group, id]);

  // React renders `hidden` as a boolean, so the panel takes `until-found` once it is in the page.
  // A browser without it hides the panel plainly, and find in page skips the content.
  useBrowserLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null || isOpen) {
      return;
    }
    panel.setAttribute('hidden', 'until-found');
    const onBeforeMatch = (event: Event) => {
      requestRef.current(true, 'find', event);
    };
    panel.addEventListener('beforematch', onBeforeMatch);
    return () => {
      panel.removeEventListener('beforematch', onBeforeMatch);
    };
  }, [isOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const root = event.currentTarget.closest('.ui-accordion-item')?.parentElement;
    if (group === null || root === null || root === undefined) {
      return;
    }
    const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>(TRIGGERS));
    const next = nextAccordionHeading(
      event.key,
      triggers.indexOf(event.currentTarget),
      triggers.map((trigger) => !trigger.disabled),
    );
    if (next !== undefined) {
      event.preventDefault();
      triggers[next]?.focus();
    }
  };

  return (
    <div
      className={classNames(
        'ui-accordion-item',
        'ui-accordion-item__base',
        className,
        isOpen && 'ui-accordion-item--open',
        disabled && 'ui-accordion-item--disabled',
      )}
      {...rest}
    >
      <Heading className="ui-accordion-item__heading">
        <button
          type="button"
          id={triggerId}
          className="ui-accordion-item__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          onClick={(event) => {
            request(!isOpen, 'trigger', event.nativeEvent);
          }}
          onKeyDown={onKeyDown}
        >
          <span className="ui-accordion-item__label">{label}</span>
          <span
            className="ui-accordion-item__icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconChevronDown }}
          />
        </button>
      </Heading>
      <div
        ref={panelRef}
        id={panelId}
        className="ui-accordion-item__panel"
        role="region"
        aria-labelledby={triggerId}
        hidden={!isOpen}
      >
        <div className="ui-accordion-item__body">{children}</div>
      </div>
    </div>
  );
}
