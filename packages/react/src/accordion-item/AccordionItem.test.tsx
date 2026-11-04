import { createRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Accordion } from '../accordion/Accordion.tsx';
import { AccordionItem } from './AccordionItem.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('AccordionItem', () => {
  it('passes its ref and the attributes of the page to its root element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<AccordionItem ref={ref} label="Shipping" data-testid="section" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.dataset['testid']).toBe('section');
  });

  it('renders closed content into the server HTML and hydrates without a warning', async () => {
    const element = (
      <Accordion>
        <AccordionItem label="Shipping">Orders ship within two days.</AccordionItem>
      </Accordion>
    );
    const html = renderToString(element);
    expect(html).toContain('Orders ship within two days.');
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
    // Once it hydrates, the closed panel waits for find in page.
    expect(container.querySelector('[role="region"]')?.getAttribute('hidden')).toBe('until-found');
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('follows open when controlled and reports each request', async () => {
    const onOpenChange = vi.fn();
    const screen = await render(
      <AccordionItem label="Shipping" open={false} onOpenChange={onOpenChange}>
        Content
      </AccordionItem>,
    );
    const button = screen.getByRole('button', { name: 'Shipping' });
    await userEvent.click(button);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger' }));
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens from defaultOpen when uncontrolled', async () => {
    const screen = await render(
      <AccordionItem label="Shipping" defaultOpen>
        Content
      </AccordionItem>,
    );
    await expect
      .element(screen.getByRole('button', { name: 'Shipping' }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('opens on beforematch with the reason find', async () => {
    const onOpenChange = vi.fn();
    const screen = await render(
      <AccordionItem label="Shipping" onOpenChange={onOpenChange}>
        Content
      </AccordionItem>,
    );
    const panel = screen.container.querySelector('[role="region"]');
    panel?.dispatchEvent(new Event('beforematch'));
    await expect
      .element(screen.getByRole('button', { name: 'Shipping' }))
      .toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'find' }));
  });

  it('closes a controlled section of a group with the reason group', async () => {
    const changes: string[] = [];
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Accordion>
          <AccordionItem
            label="Shipping"
            open={open}
            onOpenChange={(next, details) => {
              changes.push(`${String(next)} ${details.reason}`);
              setOpen(next);
            }}
          >
            Shipping content
          </AccordionItem>
          <AccordionItem label="Returns">Returns content</AccordionItem>
        </Accordion>
      );
    }
    const screen = await render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    await expect
      .element(screen.getByRole('button', { name: 'Shipping' }))
      .toHaveAttribute('aria-expanded', 'false');
    expect(changes).toEqual(['false group']);
  });
});
