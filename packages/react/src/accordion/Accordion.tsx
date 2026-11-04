'use client';

import type { AccordionProps as SharedAccordionProps } from '@mszczygiel-projects/ui-core-shared/accordion';
import {
  type ComponentPropsWithRef,
  createContext,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { classNames } from '../internal/class-names.ts';

const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** What a section of an Accordion lets its group do. */
export interface AccordionSectionHandle {
  /** Closes the section because another one opened, with the event that opened it. */
  readonly close: (originalEvent: Event) => void;
}

/** What a group gives its sections. */
export interface AccordionContextValue {
  /** Keeps a section until it unmounts; returns the function that lets it go. */
  readonly register: (id: string, section: AccordionSectionHandle) => () => void;
  /** A section opened, so a group that keeps one open closes the others. */
  readonly opened: (id: string, originalEvent: Event) => void;
}

/** The group of the sections inside it, or null outside a group. */
export const AccordionContext = createContext<AccordionContextValue | null>(null);

/** The props of Accordion. Other attributes of a `div` and ref go to its root element. */
export interface AccordionProps
  extends SharedAccordionProps, Omit<ComponentPropsWithRef<'div'>, keyof SharedAccordionProps> {
  /** The sections, AccordionItem elements. */
  children?: ReactNode;
}

/**
 * A stack of sections whose headings show and hide their content.
 *
 * Its children are AccordionItem elements. Without `multiple`, a section that the user opens
 * closes the others, and each closed section reports it through `onOpenChange` with the reason
 * `group`. A line separates the sections.
 */
export function Accordion({ multiple = false, className, children, ...rest }: AccordionProps) {
  const sections = useRef(new Map<string, AccordionSectionHandle>());
  const multipleRef = useRef(multiple);
  useBrowserLayoutEffect(() => {
    multipleRef.current = multiple;
  });
  const context = useMemo<AccordionContextValue>(
    () => ({
      register: (id, section) => {
        sections.current.set(id, section);
        return () => {
          sections.current.delete(id);
        };
      },
      opened: (id, originalEvent) => {
        if (multipleRef.current) {
          return;
        }
        for (const [other, section] of sections.current) {
          if (other !== id) {
            section.close(originalEvent);
          }
        }
      },
    }),
    [],
  );

  return (
    <div className={classNames('ui-accordion', 'ui-accordion__base', className)} {...rest}>
      <AccordionContext value={context}>{children}</AccordionContext>
    </div>
  );
}
