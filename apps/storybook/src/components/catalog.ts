import type {
  ComponentCategory,
  ComponentSpec,
} from '@mszczygiel-projects/ui-core-shared/component';
import { specs } from '@mszczygiel-projects/ui-core-shared/components';

/** The specifications of the components the library has, as the shared package lists them. */
export { specs };

/** A component the library plans, before its specification exists. */
interface Planned {
  readonly name: string;
  readonly tag: `ui-${string}`;
  readonly category: ComponentCategory;
}

/** The sections of the library, in the order of the site. */
export const categories: readonly ComponentCategory[] = [
  'Actions',
  'Inputs',
  'Selection',
  'Feedback',
  'Navigation',
  'Content',
  'Overlays',
];

const planned: readonly Planned[] = [
  { name: 'IconButton', tag: 'ui-icon-button', category: 'Actions' },
  { name: 'LinkButton', tag: 'ui-link-button', category: 'Actions' },
  { name: 'PasswordField', tag: 'ui-password-field', category: 'Inputs' },
  { name: 'SearchField', tag: 'ui-search-field', category: 'Inputs' },
  { name: 'NumberField', tag: 'ui-number-field', category: 'Inputs' },
  { name: 'TextareaField', tag: 'ui-textarea-field', category: 'Inputs' },
  { name: 'DateField', tag: 'ui-date-field', category: 'Inputs' },
  { name: 'FileInputField', tag: 'ui-file-input-field', category: 'Inputs' },
  { name: 'CheckboxField', tag: 'ui-checkbox-field', category: 'Selection' },
  { name: 'RadioGroup', tag: 'ui-radio-group', category: 'Selection' },
  { name: 'RadioField', tag: 'ui-radio-field', category: 'Selection' },
  { name: 'SwitchField', tag: 'ui-switch-field', category: 'Selection' },
  { name: 'SelectField', tag: 'ui-select-field', category: 'Selection' },
  { name: 'Combobox', tag: 'ui-combobox', category: 'Selection' },
  { name: 'Listbox', tag: 'ui-listbox', category: 'Selection' },
  { name: 'Calendar', tag: 'ui-calendar', category: 'Selection' },
  { name: 'Badge', tag: 'ui-badge', category: 'Feedback' },
  { name: 'Chip', tag: 'ui-chip', category: 'Feedback' },
  { name: 'Notification', tag: 'ui-notification', category: 'Feedback' },
  { name: 'Breadcrumbs', tag: 'ui-breadcrumbs', category: 'Navigation' },
  { name: 'Pagination', tag: 'ui-pagination', category: 'Navigation' },
  { name: 'Dialog', tag: 'ui-dialog', category: 'Overlays' },
  { name: 'Drawer', tag: 'ui-drawer', category: 'Overlays' },
  { name: 'Popover', tag: 'ui-popover', category: 'Overlays' },
];

/** One row of the status page. */
export interface CatalogEntry {
  readonly name: string;
  readonly tag: string;
  readonly category: ComponentCategory;
  readonly partOf?: string;
  readonly status: ComponentSpec['status'];
  readonly figma: string | null;
}

/** Every component, specified or planned, in the order of its category. */
export const catalog: readonly CatalogEntry[] = [
  ...specs,
  ...planned
    .filter((entry) => !specs.some((spec) => spec.name === entry.name))
    .map((entry) => ({ ...entry, status: 'planned' as const, figma: null })),
];

/** The specification of a component by name. */
export function specOf(name: string): ComponentSpec {
  const spec = specs.find((candidate) => candidate.name === name);
  if (spec === undefined) {
    throw new Error(`No specification of ${name}`);
  }
  return spec;
}

/**
 * The id of the documentation page of a component, as Storybook derives it from its title. A part
 * is documented on the page of the component it belongs to.
 */
export function pageOf(spec: Pick<ComponentSpec, 'name' | 'category' | 'partOf'>): string {
  const name = spec.partOf ?? spec.name;
  return `components-${spec.category.toLowerCase()}-${name.toLowerCase()}-docs--docs`;
}
