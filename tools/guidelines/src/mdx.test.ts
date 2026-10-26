import { describe, expect, it } from 'vitest';

import { sectionsOf } from './mdx.ts';

describe('sectionsOf', () => {
  it('keeps the prose of each section and drops what only Storybook reads', () => {
    const sections = sectionsOf(
      [
        "import { Meta } from '@storybook/addon-docs/blocks';",
        '<Meta title="Components/Actions/Button/Docs" />',
        '# Button',
        '## Usage',
        'Use Button for one action.',
        '<FrameworkCanvas',
        '  react={ReactStories.Variants}',
        '/>',
        '- Not for navigation.',
        '```ts',
        "configureUiCore({ labels: { button: { loading: 'Zapisywanie' } } });",
        '```',
        '## States',
        'Hover and press share the active colours.',
      ].join('\n'),
    );
    expect([...sections.keys()]).toEqual(['Usage', 'States']);
    expect(sections.get('Usage')).toBe('Use Button for one action.\n- Not for navigation.');
    expect(sections.get('States')).toBe('Hover and press share the active colours.');
  });
});
