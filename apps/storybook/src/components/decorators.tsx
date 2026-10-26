import type { Decorator } from '@storybook/react-vite';

import { ContextFrame } from '../blocks/ContextFrame.tsx';
import { manifest } from '../manifest.ts';

/** Shows the story once on every surface, in frames painted with their backgrounds. */
export const onSurfaces: Decorator = (Story) => (
  <div className="sb-surfaces">
    {manifest.modes.surface.map((surface) => (
      <ContextFrame key={surface} context={{ surface }}>
        <Story />
      </ContextFrame>
    ))}
  </div>
);
