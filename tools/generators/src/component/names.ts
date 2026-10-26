import type { ComponentCategory } from '@mszczygiel-projects/ui-core-shared/component';

/** The options of the generator, as Nx passes them. */
export interface ComponentOptions {
  readonly name: string;
  readonly category: ComponentCategory;
  readonly figma?: string;
  readonly form?: boolean;
}

/** Every spelling of a component's name that its files use. */
export interface ComponentNames {
  /** `IconButton`: the React component and the specification's name. */
  readonly name: string;
  /** `icon-button`: folders and files of the web component and the shared module. */
  readonly kebab: string;
  /** `iconButton`: the export of the specification. */
  readonly camel: string;
  /** `ui-icon-button`: the tag. */
  readonly tag: string;
  /** `UiIconButton`: the class of the web component. */
  readonly className: string;
  /** `actions`: the folder of the documentation site. */
  readonly folder: string;
  readonly category: ComponentCategory;
  readonly figma: string | undefined;
  readonly form: boolean;
}

export function namesOf(options: ComponentOptions): ComponentNames {
  const kebab = options.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return {
    name: options.name,
    kebab,
    camel: options.name.charAt(0).toLowerCase() + options.name.slice(1),
    tag: `ui-${kebab}`,
    className: `Ui${options.name}`,
    folder: options.category.toLowerCase(),
    category: options.category,
    figma: options.figma,
    form: options.form === true,
  };
}
