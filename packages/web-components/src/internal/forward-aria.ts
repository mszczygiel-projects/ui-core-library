import { followAttribute } from './follow-attribute.ts';

/** The attributes of a popup that an action passes from its host to its inner control. */
export interface ForwardedAria {
  readonly 'aria-expanded'?: string;
  readonly 'aria-haspopup'?: string;
}

/** An element whose ARIA relationships the browser reflects as element references. */
interface ReflectedDescription {
  ariaDescribedByElements: readonly Element[] | null;
}

/**
 * Whether the browser reflects `ariaDescribedByElements`. Without it, a trigger has no description
 * from its tooltip, which still shows its text.
 */
export function reflectsDescription(element: Element): element is Element & ReflectedDescription {
  return 'ariaDescribedByElements' in element;
}

/**
 * Follows `aria-expanded` and `aria-haspopup` on the host, which Popover writes on its trigger,
 * and `aria-describedby`, which the browser sets when Tooltip sets the elements that describe it.
 * Returns the function that stops following them.
 */
export function followForwardedAria(
  host: HTMLElement,
  onChange: (aria: ForwardedAria) => void,
): () => void {
  let aria: ForwardedAria = {};
  const stops = (['aria-expanded', 'aria-haspopup', 'aria-describedby'] as const).map((name) =>
    followAttribute(host, name, (value) => {
      // A change of the described elements is a new object, so that the component renders again
      // and copies them.
      aria = name === 'aria-describedby' ? { ...aria } : { ...aria, [name]: value ?? undefined };
      onChange(aria);
    }),
  );
  return () => {
    for (const stop of stops) {
      stop();
    }
  };
}

/**
 * Describes the inner control by its own description, such as the loading state, and by the
 * elements that describe the host. Element references cross the shadow root from the control to
 * the page, which an id cannot.
 */
export function forwardDescription(
  host: HTMLElement,
  control: Element | null | undefined,
  own: readonly Element[],
): void {
  if (
    control === null ||
    control === undefined ||
    !reflectsDescription(host) ||
    !reflectsDescription(control)
  ) {
    return;
  }
  const described = host.ariaDescribedByElements ?? [];
  if (described.length > 0) {
    control.ariaDescribedByElements = [...own, ...described];
    forwarded.add(control);
  } else if (forwarded.has(control)) {
    // The tooltip has gone: the control keeps only its own description.
    control.ariaDescribedByElements = own.length > 0 ? own : null;
    forwarded.delete(control);
  }
}

/** The controls that carry a description from their host, so that its removal reaches them. */
const forwarded = new WeakSet<Element>();
