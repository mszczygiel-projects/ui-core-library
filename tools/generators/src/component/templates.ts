import type { ComponentNames } from './names.ts';

/**
 * The files of a new component, by path from the root of the workspace. Every place that needs a
 * decision carries `TODO(component)`, which a component may not keep once its status is `done`.
 */
export const TODO = 'TODO(component)';

const FIGMA_FILE = 'https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/';

const shared = (n: ComponentNames) => `import { defineComponent } from './component.ts';

/** The specification of ${n.name}. */
export const ${n.camel} = defineComponent({
  name: '${n.name}',
  tag: '${n.tag}',
  category: '${n.category}',
  status: 'in-progress',
  figma: ${n.figma === undefined ? 'null' : `'${n.figma}'`},
  // ${TODO}: the variants, the boolean props and the design-only properties of the component set.
  design: { flags: [${n.form ? "'disabled'" : ''}], codeOnly: [], previews: {} },
  summary: '${TODO}: one sentence that says what ${n.name} is for.',
  options: {},
  labels: [],
  parts: ['base'],
  slots: [],
  events: [],
  stories: ['Playground', 'OnSurfaces'],
  exceptions: [],
});

/** The props both implementations of ${n.name} share. */
export interface ${n.name}Props {
${
  n.form
    ? `  /** The accessible name of the control. */
  label?: string;
  /** The name of the form entry. */
  name?: string;
  /** The current value. */
  value?: string;
  /**
   * Prevents interaction and submission.
   * @default false
   */
  disabled?: boolean;
`
    : `  /** ${TODO}: the props of ${n.name}, as both implementations take them. */
  label?: string;
`
}}
`;

const stencilPlain = (
  n: ComponentNames,
) => `import type { ${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import { Component, h, Prop, type VNode } from '@stencil/core';

/**
 * ${TODO}: the summary of the specification, then what the web component does.
 *
 * @slot - The content of the component.
 * @part base - ${TODO}: what the part is.
 */
@Component({ tag: '${n.tag}', styleUrl: '${n.kebab}.css', shadow: true })
export class ${n.className} implements ${n.name}Props {
  /** ${TODO}: what the label does. */
  @Prop() label?: string;

  render(): VNode {
    return (
      <span part="base" class="base">
        <slot />
      </span>
    );
  }
}

/**
 * Every prop of the specification is a prop of the component. \`implements\` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<${n.className}, keyof ${n.name}Props>;
`;

const stencilForm = (
  n: ComponentNames,
) => `import type { ${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import { AttachInternals, Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { copyValidity, submitNamed } from '../internal/form-value.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUi${n.name}Element extends HTMLElement, FormAssociated {
    /** The current value. The \`value\` attribute supplies the initial and reset value. */
    value: string;
  }
}

/**
 * ${TODO}: the summary of the specification, then what the web component does.
 *
 * @part base - ${TODO}: what the part is.
 * @part control - The native control, which owns the semantics.
 */
@Component({
  tag: '${n.tag}',
  styleUrl: '${n.kebab}.css',
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class ${n.className} implements ${n.name}Props, FormAssociated {
  @Element() host!: HTMLUi${n.name}Element;

  @AttachInternals() internals!: ElementInternals;

  /** The accessible name of the control. */
  @Prop() label?: string;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** The current value of the control. */
  @State() private current = '';

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** Whether a user or a script set the value, after which the attribute only supplies a reset. */
  private dirty = false;

  private stopFollowing: (() => void)[] = [];

  /** The current value. The \`value\` attribute supplies the initial and reset value. */
  get value(): string {
    return this.current;
  }

  set value(value: string) {
    this.restore(typeof value === 'string' ? value : '');
    this.dirty = true;
  }

  /** The associated form, including an explicit \`form\` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, from the native control. */
  get validity(): ValidityState {
    this.syncValidity();
    return this.internals.validity;
  }

  /** The native validation message. */
  get validationMessage(): string {
    this.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches \`invalid\` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native control as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.syncValidity();
    return this.internals.reportValidity();
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followAttribute(this.host, 'value', (value) => {
        // Once the value is dirty, the attribute only supplies what a reset restores.
        if (!this.dirty) {
          this.restore(value ?? '');
        }
      }),
    ];
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  /**
   * Takes the disabled state the browser computes: the host's own \`disabled\` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the value of the attribute without emitting an edit event. */
  formResetCallback(): void {
    this.restore(this.host.getAttribute('value') ?? '');
    this.dirty = false;
  }

  /** Restores a value the browser saved, without emitting an edit event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.restore(state);
    }
  }

  componentDidRender(): void {
    submitNamed(this.internals, this.name, this.current);
    this.syncValidity();
  }

  render(): VNode {
    // ${TODO}: the native control of the component, with its constraints.
    return (
      <span part="base" class="base">
        <input
          part="control"
          class="control"
          name={this.name}
          value={this.current}
          disabled={this.disabled || this.formDisabled}
          aria-label={this.label}
          onInput={this.onInput}
        />
      </span>
    );
  }

  private control(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private restore(value: string): void {
    const control = this.control();
    if (control !== null) {
      control.value = value;
    }
    this.current = control?.value ?? value;
    submitNamed(this.internals, this.name, this.current);
    this.syncValidity();
  }

  private syncValidity(): void {
    const control = this.control();
    if (control !== null) {
      copyValidity(this.internals, control, control);
    }
  }

  private readonly onInput = (event: globalThis.Event): void => {
    const control = event.currentTarget;
    if (control instanceof HTMLInputElement) {
      this.current = control.value;
      this.dirty = true;
      submitNamed(this.internals, this.name, this.current);
      this.syncValidity();
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. \`implements\` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<${n.className}, keyof ${n.name}Props>;
`;

const stencilCss = (n: ComponentNames) => `:host {
  display: inline-flex;
}

:host([hidden]) {
  display: none;
}

/* ${TODO}: the Components tokens of ${n.name}, read into private --_ properties. */
.base {
  display: inline-flex;
}
`;

const stencilTest = (n: ComponentNames) => `import '../../dist/components/${n.tag}.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('${n.tag}').forEach((node) => {
    node.remove();
  });
});

describe('${n.tag}', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('${n.tag}')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('${n.tag}');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  // ${TODO}: what only the web component does, such as its attributes and properties.
});
`;

const reactPlain = (
  n: ComponentNames,
) => `import type { ${n.name}Props as Shared${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import type { ComponentPropsWithRef } from 'react';

import { classNames } from '../internal/class-names.ts';

/** The props of ${n.name}. Other attributes of a \`span\` go to its root element. */
export interface ${n.name}Props
  extends Shared${n.name}Props,
    Omit<ComponentPropsWithRef<'span'>, keyof Shared${n.name}Props> {}

/** ${TODO}: the summary of the specification, then what the React component does. */
export function ${n.name}({ label: _label, className, children, ...rest }: ${n.name}Props) {
  return (
    <span className={classNames('${n.tag}', '${n.tag}__base', className)} {...rest}>
      {children}
    </span>
  );
}
`;

const reactForm = (
  n: ComponentNames,
) => `import type { ${n.name}Props as Shared${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import type { ComponentPropsWithRef } from 'react';

import { classNames } from '../internal/class-names.ts';

/** The props of ${n.name}. Native attributes and \`ref\` reach its native control. */
export interface ${n.name}Props
  extends Shared${n.name}Props,
    Omit<ComponentPropsWithRef<'input'>, keyof Shared${n.name}Props | 'defaultValue'> {
  /** The initial uncontrolled value, restored by a native form reset. */
  defaultValue?: string;
}

/** ${TODO}: the summary of the specification, then what the React component does. */
export function ${n.name}({ label, className, style, ...rest }: ${n.name}Props) {
  // ${TODO}: the native control of the component, with its constraints.
  return (
    <span className={classNames('${n.tag}', '${n.tag}__base', className)} style={style}>
      <input className="${n.tag}__control" aria-label={label} {...rest} />
    </span>
  );
}
`;

const reactCss = (
  n: ComponentNames,
) => `/* ${TODO}: the Components tokens of ${n.name}, read into private --_ properties. */
.${n.tag} {
  display: inline-flex;
}
`;

const reactTest = (n: ComponentNames) => `import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ${n.name} } from './${n.name}.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('${n.name}', () => {
  it('passes its ref ${n.form ? 'to its native control' : 'to its root element'}', async () => {
    const ref = createRef<${n.form ? 'HTMLInputElement' : 'HTMLSpanElement'}>();
    await render(<${n.name} ref={ref} />);
    expect(ref.current).toBeInstanceOf(${n.form ? 'HTMLInputElement' : 'HTMLSpanElement'});
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<${n.name} />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <${n.name} />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  // ${TODO}: what only the React component does, such as controlled values.
});
`;

const contract = (
  n: ComponentNames,
) => `import type { ${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import { expect, it } from 'vitest';

import type { Mount } from '../harness/types.ts';

/** The props of the specification, plus what each harness translates. */
export interface ${n.name}ContractProps extends ${n.name}Props {
  readonly children?: string;${n.form ? '\n  /** The initial value: the value attribute of the web component, defaultValue in React. */\n  readonly defaultValue?: string;' : ''}
}

/** The behaviour of ${n.name}, applied unchanged to the web component and the React component. */
export function ${n.camel}Contract(mount: Mount<${n.name}ContractProps>): void {
${
  n.form
    ? `  it('submits its value under its name, and resets to its initial value', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const control = await mount({ name: 'entry', defaultValue: 'First' }, { parent: form });
    expect(new FormData(form).get('entry')).toBe('First');
    form.reset();
    expect(new FormData(form).get('entry')).toBe('First');
    await control.unmount();
    form.remove();
  });

  it('follows a disabled fieldset', async () => {
    const fieldset = document.createElement('fieldset');
    document.body.append(fieldset);
    const control = await mount({ name: 'entry' }, { parent: fieldset });
    fieldset.disabled = true;
    await expect.poll(() => control.part('control').matches(':disabled')).toBe(true);
    await control.unmount();
    fieldset.remove();
  });
`
    : `  it('renders its content', async () => {
    const component = await mount({ children: 'Content' });
    expect(component.element.textContent).toContain('Content');
    await component.unmount();
  });
`
}
  // ${TODO}: roles and names, keys, events, labels, right-to-left text and appearance.
}
`;

const harness = (
  n: ComponentNames,
) => `import { ${n.name} } from '@mszczygiel-projects/ui-core-react';

import type { ${n.name}ContractProps } from '../specs/${n.kebab}.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties and content as text, as a page would. */
export const mountWebComponent${n.name} = webComponentMount<${n.name}ContractProps>(
  '${n.tag}',
  (element, { children, ${n.form ? 'defaultValue, ' : ''}...properties }) => {${
    n.form
      ? `
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }`
      : ''
  }
    Object.assign(element, properties);
    if (children !== undefined) {
      element.textContent = children;
    }
  },
);

export const mountReact${n.name} = reactMount(${n.name}, '${n.tag}');
`;

const page = (n: ComponentNames) => `import { Meta } from '@storybook/addon-docs/blocks';

import { ReactApi, WebComponentApi } from '../../blocks/ApiTable.tsx';
import { ComponentOverview } from '../../blocks/ComponentStatus.tsx';
import { ComponentTokens } from '../../blocks/ComponentTokens.tsx';
import { FrameworkTabs } from '../../blocks/Framework.tsx';
import * as ReactStories from './${n.name}.react.stories.tsx';

<Meta title="Components/${n.category}/${n.name}/Docs" />

# ${n.name}

<ComponentOverview name="${n.name}" />

## Usage

${TODO}: when to use ${n.name}, and when not to.

## Anatomy

${TODO}: the parts, as the web component, the React component and Figma name them.

## Variants & tone

${TODO}: the variants, or why none apply.

## Sizes & density

${TODO}: the sizes, or why none apply.

## States

${TODO}: the states and how they look.

## Content & labels

${TODO}: the content, the labels and the texts of the configuration.

## Behaviour

${TODO}: the keys, the focus and the value.

## Accessibility

${TODO}: the WAI-ARIA pattern, or that none applies, and its keys.

## Surfaces & themes

${TODO}: how the colours follow the surface and the theme.

## API

<FrameworkTabs
  of={ReactStories.Playground}
  react={<ReactApi component="${n.name}" />}
  webComponents={<WebComponentApi tag="${n.tag}" />}
/>

## Tokens

<ComponentTokens component="${n.kebab}" />

## Implementation notes

${TODO}: what each implementation does differently, and why.
`;

const reactStories = (
  n: ComponentNames,
) => `import { ${n.name} } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const meta = {
  title: 'Components/${n.category}/${n.name}/React',
  component: ${n.name},
  // ${TODO}: the args and the controls of the specification.
  args: ${n.form ? `{ label: '${n.name}' }` : '{}'},
  argTypes: {},
} satisfies Meta<typeof ${n.name}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
`;

const wcStories = (
  n: ComponentNames,
) => `import '@mszczygiel-projects/ui-core-web-components/${n.kebab}';

import type { ${n.name}Props } from '@mszczygiel-projects/ui-core-shared/${n.kebab}';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

// ${TODO}: the args and the controls of the specification.
type ${n.name}Args = ${n.name}Props;

/** The HTML of the component, which the code panel shows. */
const source = (args: ${n.name}Args) => htmlOf('${n.tag}', { ...args });

const meta = {
  title: 'Components/${n.category}/${n.name}/Web Component',
  tags: ['!manifest'],
  args: ${n.form ? `{ label: '${n.name}' }` : '{}'},
  render: (args) => <${n.tag} {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: ${n.name}Args }) => source(args),
      },
    },
  },
} satisfies Meta<${n.name}Args>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
`;

const figmaReact = (
  n: ComponentNames,
  figma: string,
) => `// url=${FIGMA_FILE}?node-id=${figma.replace(':', '-')}
// source=packages/react/src/${n.kebab}/${n.name}.tsx
// component=${n.name}
import figma from 'figma';

// ${TODO}: map every property of the component set to the props of the component.
export default {
  example: figma.code\`<${n.name} />\`,
  imports: ["import { ${n.name} } from '@mszczygiel-projects/ui-core-react'"],
  id: '${n.kebab}',
  metadata: { nestable: true },
};
`;

const figmaWc = (
  n: ComponentNames,
  figma: string,
) => `// url=${FIGMA_FILE}?node-id=${figma.replace(':', '-')}
// source=packages/web-components/src/${n.kebab}/${n.kebab}.tsx
// component=${n.tag}
import figma from 'figma';

// ${TODO}: map every property of the component set to the attributes of the element.
export default {
  example: figma.code\`<${n.tag}></${n.tag}>\`,
  imports: ["import '@mszczygiel-projects/ui-core-web-components/${n.kebab}'"],
  id: '${n.tag}',
  metadata: { nestable: true },
};
`;

/** Every new file of a component, by its path from the root of the workspace. */
export function componentFiles(n: ComponentNames): Record<string, string> {
  const files: Record<string, string> = {
    [`packages/shared/src/components/${n.kebab}.ts`]: shared(n),
    [`packages/web-components/src/${n.kebab}/${n.kebab}.tsx`]: n.form
      ? stencilForm(n)
      : stencilPlain(n),
    [`packages/web-components/src/${n.kebab}/${n.kebab}.css`]: stencilCss(n),
    [`packages/web-components/src/${n.kebab}/${n.kebab}.test.ts`]: stencilTest(n),
    [`packages/react/src/${n.kebab}/${n.name}.tsx`]: n.form ? reactForm(n) : reactPlain(n),
    [`packages/react/src/${n.kebab}/${n.kebab}.css`]: reactCss(n),
    [`packages/react/src/${n.kebab}/${n.name}.test.tsx`]: reactTest(n),
    [`testing/contracts/src/specs/${n.kebab}.contract.ts`]: contract(n),
    [`testing/contracts/src/harness/${n.kebab}.tsx`]: harness(n),
    [`apps/storybook/src/components/${n.folder}/${n.name}.mdx`]: page(n),
    [`apps/storybook/src/components/${n.folder}/${n.name}.react.stories.tsx`]: reactStories(n),
    [`apps/storybook/src/components/${n.folder}/${n.name}.wc.stories.tsx`]: wcStories(n),
  };
  if (n.figma !== undefined) {
    files[`packages/react/src/${n.kebab}/${n.name}.figma.ts`] = figmaReact(n, n.figma);
    files[`packages/web-components/src/${n.kebab}/${n.kebab}.figma.ts`] = figmaWc(n, n.figma);
  }
  return files;
}
