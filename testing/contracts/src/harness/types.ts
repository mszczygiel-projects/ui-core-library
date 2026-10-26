import { commands, type Locator } from 'vitest/browser';

import type { AccessibleNode } from '../browser.ts';

/** Where and how a component is mounted. */
export interface MountOptions {
  /** An existing parent, such as a fieldset, for real form integration. */
  readonly parent?: HTMLElement;
  /**
   * Attributes that the author of a page writes: on the custom element in the web component, as props of the
   * root element in React.
   */
  readonly attributes?: Readonly<Record<string, string>>;
  readonly surface?: 'default' | 'subtle' | 'inverse' | 'primary';
  readonly theme?: 'light' | 'dark';
  readonly density?: 'comfortable' | 'compact';
  readonly dir?: 'ltr' | 'rtl';
}

/**
 * A mounted component. The harnesses translate props, attributes and the lifecycle; they never
 * implement behaviour, so that a contract tests the components themselves.
 */
export interface Mounted<Props> {
  /** The element a page holds: the custom element in the web component, the root element in React. */
  readonly element: HTMLElement;
  /** Locates elements inside the frame of the component, shadow roots included. */
  readonly screen: Locator;
  /** A part of the component: `::part(<name>)` in the web component, `.ui-<block>__<name>` in React. */
  part(name: string): HTMLElement;
  /** The text the component renders, its shadow root included. */
  text(): string;
  /** The role and the name of the component in the accessibility tree of the browser. */
  accessibleNode(): Promise<AccessibleNode>;
  /** Every exposed node below the frame, for checking native control semantics. */
  accessibleTree(): Promise<readonly AccessibleNode[]>;
  update(props: Partial<Props>): Promise<void>;
  unmount(): Promise<void>;
}

export type Mount<Props> = (props: Props, options?: MountOptions) => Promise<Mounted<Props>>;

let frames = 0;

/**
 * The frame a component is mounted in: a surface and a density, as an application sets them, and
 * the id by which the browser commands find the component.
 */
export function frameAttributes(options: MountOptions): Record<string, string> {
  frames += 1;
  return {
    'data-contract-frame': `frame-${String(frames)}`,
    'data-surface': options.surface ?? 'default',
    'data-density': options.density ?? 'comfortable',
    ...(options.dir === undefined ? {} : { dir: options.dir }),
  };
}

export function required<T extends Element>(element: T | null | undefined, what: string): T {
  if (element === null || element === undefined) {
    throw new Error(`Missing ${what}`);
  }
  return element;
}

/** Reads the accessibility tree of the browser for the component of a frame. */
export function accessibleNodeOf(frame: Element): Promise<AccessibleNode> {
  return commands.accessibleNode(frame.getAttribute('data-contract-frame') ?? '');
}
