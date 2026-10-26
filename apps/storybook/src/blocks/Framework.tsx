import { Canvas, DocsContext } from '@storybook/addon-docs/blocks';
import { type ReactNode, use, useEffect, useState } from 'react';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';

/** The frameworks of the library, as the framework toolbar names them. */
export const frameworks = [
  { value: 'react', title: 'React' },
  { value: 'web-components', title: 'Web Components' },
] as const;

export type Framework = (typeof frameworks)[number]['value'];

function isFramework(value: unknown): value is Framework {
  return frameworks.some((framework) => framework.value === value);
}

/** The framework in a set of globals, or React when it names none. */
function frameworkIn(globals: unknown): Framework {
  const chosen: unknown =
    typeof globals === 'object' && globals !== null ? Reflect.get(globals, 'framework') : undefined;
  return isFramework(chosen) ? chosen : 'react';
}

/** The framework that the toolbar chooses, followed while the page is open. */
function useFramework(story: unknown): Framework {
  const context = use(DocsContext);
  const [framework, setFramework] = useState<Framework>(() => {
    const { story: resolved } = context.resolveOf(story, ['story']);
    const storyContext: unknown = context.getStoryContext(resolved);
    return frameworkIn(
      typeof storyContext === 'object' && storyContext !== null
        ? Reflect.get(storyContext, 'globals')
        : undefined,
    );
  });
  useEffect(() => {
    const follow = (event: unknown) => {
      if (typeof event === 'object' && event !== null) {
        setFramework(frameworkIn(Reflect.get(event, 'globals')));
      }
    };
    context.channel.on(GLOBALS_UPDATED, follow);
    return () => {
      context.channel.off(GLOBALS_UPDATED, follow);
    };
  }, [context]);
  return framework;
}

/** The story of the framework the toolbar chooses, with its code. The props are story exports. */
export function FrameworkCanvas({
  react,
  webComponents,
}: {
  readonly react: unknown;
  readonly webComponents: unknown;
}) {
  const framework = useFramework(react);
  return <Canvas of={framework === 'react' ? react : webComponents} />;
}

/**
 * Content in a tab per framework. The toolbar chooses the tab, and a reader can open the other
 * one without changing the toolbar.
 */
export function FrameworkTabs({
  of,
  react,
  webComponents,
}: {
  readonly of: unknown;
  readonly react: ReactNode;
  readonly webComponents: ReactNode;
}) {
  const framework = useFramework(of);
  const [chosen, setChosen] = useState<Framework | undefined>(undefined);
  const shown = chosen ?? framework;
  return (
    <div className="sb-tabs">
      <div className="sb-tabs__list" role="tablist" aria-label="Framework">
        {frameworks.map(({ value, title }) => (
          <button
            key={value}
            type="button"
            role="tab"
            className="sb-tabs__tab ui-text-label"
            aria-selected={shown === value}
            onClick={() => {
              setChosen(value);
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="sb-tabs__panel">
        {shown === 'react' ? react : webComponents}
      </div>
    </div>
  );
}
