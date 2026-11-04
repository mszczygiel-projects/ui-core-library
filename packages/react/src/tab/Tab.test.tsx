import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { Tabs } from '../tabs/Tabs.tsx';
import { Tab } from './Tab.tsx';

describe('Tab', () => {
  it('passes its ref and the attributes of the page to its panel', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Tabs>
        <Tab ref={ref} value="one" label="One" data-testid="panel">
          Content
        </Tab>
      </Tabs>,
    );
    expect(ref.current?.getAttribute('role')).toBe('tabpanel');
    expect(ref.current?.dataset['testid']).toBe('panel');
  });

  it('shows its content without a role outside a Tabs', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Tab ref={ref} value="one" label="One">
        Content
      </Tab>,
    );
    expect(ref.current?.hasAttribute('role')).toBe(false);
    expect(ref.current?.hasAttribute('hidden')).toBe(false);
  });
});
