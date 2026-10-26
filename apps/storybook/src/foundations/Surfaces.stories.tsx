import type { Meta, StoryObj } from '@storybook/react-vite';

import { SurfaceMatrix } from '../blocks/SurfaceMatrix.tsx';

const meta = {
  title: 'Foundations/Surfaces & themes',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Matrix: StoryObj = {
  render: () => <SurfaceMatrix />,
};
