import { createRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Tab } from '../tab/Tab.tsx';
import { Tabs } from './Tabs.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

function three(props: Parameters<typeof Tabs>[0] = {}) {
  return (
    <Tabs label="Product" {...props}>
      <Tab value="one" label="One">
        First panel
      </Tab>
      <Tab value="two" label="Two">
        Second panel
      </Tab>
      <Tab value="three" label="Three">
        Third panel
      </Tab>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('points a tab at the id its Tab gives the panel', async () => {
    const screen = await render(
      <Tabs label="Product">
        <Tab value="one" label="One">
          First panel
        </Tab>
        <Tab id="details" value="two" label="Two">
          Second panel
        </Tab>
      </Tabs>,
    );
    const tabs = screen.container.querySelectorAll('[role="tab"]');
    expect(tabs[1]?.getAttribute('aria-controls')).toBe('details');
    expect(document.getElementById('details')?.getAttribute('aria-labelledby')).toBe(tabs[1]?.id);
    const first = document.getElementById(tabs[0]?.getAttribute('aria-controls') ?? '');
    expect(first?.textContent).toBe('First panel');
  });

  it('passes its ref and the attributes of the page to its root element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(three({ ref, 'data-testid': 'tabs' } as Parameters<typeof Tabs>[0]));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.dataset['testid']).toBe('tabs');
  });

  it('renders every panel into the server HTML and hydrates without a warning', async () => {
    const element = three();
    const html = renderToString(element);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('Third panel');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, element, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    // Once it hydrates, the other panels wait for find in page.
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels[1]?.getAttribute('hidden')).toBe('until-found');
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('follows value when controlled and reports each tab the user selects', async () => {
    const onValueChange = vi.fn();
    const screen = await render(three({ value: 'one', onValueChange }));
    await screen.getByRole('tab', { name: 'Two' }).click();
    expect(onValueChange).toHaveBeenCalledWith(
      'two',
      expect.objectContaining({ reason: 'trigger' }),
    );
    await expect
      .element(screen.getByRole('tab', { name: 'One' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('starts from defaultValue when uncontrolled', async () => {
    const screen = await render(three({ defaultValue: 'three' }));
    await expect
      .element(screen.getByRole('tab', { name: 'Three' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('shows the panel of a match while a controlled parent decides', async () => {
    function Controlled() {
      const [value] = useState('one');
      return three({ value });
    }
    const screen = await render(<Controlled />);
    const panel = screen.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')[2];
    panel?.dispatchEvent(new Event('beforematch'));
    await nextFrame();
    expect(panel?.hasAttribute('hidden')).toBe(false);
  });

  it('renders the icon of a tab before its label, hidden from assistive technology', async () => {
    const screen = await render(
      <Tabs>
        <Tab value="one" label="One" icon={<svg data-testid="icon" />}>
          First
        </Tab>
      </Tabs>,
    );
    const icon = screen.container.querySelector('.ui-tabs__tab-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    await expect.element(screen.getByRole('tab', { name: 'One' })).toBeInTheDocument();
  });
});
