/**
 * The specification of a component: what both implementations, the contracts, the stories and the
 * documentation share. Each implementation imports its types and values, so a value added here is
 * a type error until both handle it.
 */

/** The sections of the library, in the order of the documentation site. */
export type ComponentCategory =
  'Actions' | 'Inputs' | 'Selection' | 'Feedback' | 'Navigation' | 'Overlays';

/** Whether a component is planned, being built or meets the Definition of Done. */
export type ComponentStatus = 'planned' | 'in-progress' | 'done';

/** A prop that takes one of a set of values, and falls back to its default for any other. */
export interface OptionsSpec<Option extends string = string> {
  readonly options: readonly Option[];
  readonly default: Option;
}

/** A property of the Figma component set that only previews a design and has no prop. */
export interface PreviewSpec extends OptionsSpec {
  /** What it previews, for designers and agents. */
  readonly note: string;
}

/** How the Figma component set exposes the props of the component. */
export interface DesignSpec {
  /** Boolean props that the component set has as variants with `false` and `true`. */
  readonly flags: readonly string[];
  /** Props of `options` that only code has, such as the native `type` of a button. */
  readonly codeOnly: readonly string[];
  /** Properties that only the component set has. */
  readonly previews: Readonly<Record<string, PreviewSpec>>;
}

/** A documented difference from the shared conventions, with its reason. */
export interface ExceptionSpec {
  readonly items: readonly string[];
  readonly reason: string;
}

export interface ComponentSpec {
  /** The PascalCase name, which React exports. */
  readonly name: string;
  /** The tag the web component defines. */
  readonly tag: `ui-${string}`;
  readonly category: ComponentCategory;
  readonly status: ComponentStatus;
  /** The node of the component set in [Core] UI Library, or null before it exists. */
  readonly figma: string | null;
  /** How the component set exposes the props. */
  readonly design: DesignSpec;
  /** One sentence, the same in JSDoc, on the documentation page and in Figma. */
  readonly summary: string;
  /** The props that take one of a set of values. */
  readonly options: Readonly<Record<string, OptionsSpec>>;
  /** The keys of `labels.<component>` in the configuration. */
  readonly labels: readonly string[];
  /** The parts: `::part()` names of the web component, BEM elements in React. */
  readonly parts: readonly string[];
  /** The named slots of the web component, paired with camelCase React props. */
  readonly slots: readonly string[];
  /** The custom events of the web component, paired with React callbacks. */
  readonly events: readonly string[];
  /** The stories both frameworks have, with the same names. */
  readonly stories: readonly string[];
  readonly exceptions: readonly ExceptionSpec[];
}

/** Checks a specification against the shape and keeps its literal types. */
export function defineComponent<const Spec extends ComponentSpec>(spec: Spec): Spec {
  return spec;
}

/** The values of an options prop of a specification, as a union. */
export type OptionOf<
  Spec extends ComponentSpec,
  Prop extends keyof Spec['options'],
> = Spec['options'][Prop]['options'][number];
