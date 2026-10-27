import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Badge. */
export const badge = defineComponent({
  name: 'Badge',
  tag: 'ui-badge',
  category: 'Feedback',
  status: 'done',
  figma: '2037:98',
  design: {
    flags: [],
    booleans: [],
    codeOnly: [],
    previews: {
      content: {
        options: ['label', 'icon-label', 'icon'],
        default: 'label',
        note: 'Chooses the layout of a badge with text, with an icon and text, or with only an icon. Code derives it from the content.',
      },
    },
  },
  summary: 'Marks a status, a category or a count with a short label, an icon or both.',
  options: {
    tone: {
      options: ['neutral', 'brand', 'info', 'success', 'warning', 'error'],
      default: 'neutral',
    },
    variant: { options: ['solid', 'subtle'], default: 'solid' },
    size: { options: ['small', 'medium'], default: 'medium' },
    shape: { options: ['rounded', 'square'], default: 'rounded' },
  },
  labels: [],
  parts: ['base', 'icon', 'label'],
  slots: ['icon'],
  events: [],
  stories: ['Playground', 'Variants', 'Shapes', 'WithIcon', 'OnSurfaces'],
  exceptions: [],
});

/** The meaning a badge carries: none, the brand, or one of the feedback tones. */
export type BadgeTone = OptionOf<typeof badge, 'tone'>;
/** The emphasis of a badge: a strong fill or a light tint. */
export type BadgeVariant = OptionOf<typeof badge, 'variant'>;
/** The sizes of a badge, each following the density. */
export type BadgeSize = OptionOf<typeof badge, 'size'>;
/** The corners of a badge: a pill or a small radius. */
export type BadgeShape = OptionOf<typeof badge, 'shape'>;

/** The props both implementations of Badge share. */
export interface BadgeProps {
  /**
   * The meaning the badge carries.
   * @default 'neutral'
   */
  tone?: BadgeTone;
  /**
   * The emphasis of the badge.
   * @default 'solid'
   */
  variant?: BadgeVariant;
  /**
   * The size, which follows the density.
   * @default 'medium'
   */
  size?: BadgeSize;
  /**
   * The corners of the badge.
   * @default 'rounded'
   */
  shape?: BadgeShape;
  /**
   * The accessible name of a badge that shows only an icon. A badge with text is named by its
   * text, and an author's `aria-label` wins.
   */
  label?: string;
}
