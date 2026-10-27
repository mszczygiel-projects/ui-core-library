import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Loader. */
export const loader = defineComponent({
  name: 'Loader',
  tag: 'ui-loader',
  category: 'Feedback',
  status: 'done',
  figma: '103:773',
  design: { flags: [], booleans: [], codeOnly: [], previews: {} },
  summary: 'Shows that content is loading or that an action is in progress.',
  options: {
    size: { options: ['small', 'medium', 'large'], default: 'medium' },
  },
  labels: ['label'],
  parts: ['indicator'],
  slots: [],
  events: [],
  stories: ['Playground', 'OnSurfaces'],
  exceptions: [],
});

/** The diameters of a loader, each following the density. */
export type LoaderSize = OptionOf<typeof loader, 'size'>;

/** The props both implementations of Loader share. */
export interface LoaderProps {
  /**
   * The diameter, which follows the density.
   * @default 'medium'
   */
  size?: LoaderSize;
  /** The accessible name. Without it, the loader takes `labels.loader.label`. */
  label?: string;
}
