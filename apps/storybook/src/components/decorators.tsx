import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { ContextFrame } from '../blocks/ContextFrame.tsx';
import { manifest } from '../manifest.ts';

/** Renders once on every surface, in frames painted with their backgrounds. */
export function forEachSurface(render: (surface: string) => ReactNode) {
  return (
    <div className="sb-surfaces">
      {manifest.modes.surface.map((surface) => (
        <ContextFrame key={surface} context={{ surface }}>
          {render(surface)}
        </ContextFrame>
      ))}
    </div>
  );
}

/** Shows the story once on every surface, in frames painted with their backgrounds. */
export const onSurfaces: Decorator = (Story) => forEachSurface(() => <Story />);
