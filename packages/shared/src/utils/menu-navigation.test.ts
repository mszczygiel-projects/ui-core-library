import { describe, expect, it } from 'vitest';

import type { MenuItem } from '../components/menu.ts';
import { menuKeyAction, openingIndex } from './menu-navigation.ts';

const item = (label: string, disabled = false): MenuItem => ({
  value: label.toLowerCase(),
  label,
  disabled,
});

const items = [item('Copy', true), item('Paste'), item('Rename'), item('Delete', true)];

describe('openingIndex', () => {
  it('opens on the first enabled item with Arrow Down and the last with Arrow Up', () => {
    expect(openingIndex(items, 'ArrowDown')).toBe(1);
    expect(openingIndex(items, 'ArrowUp')).toBe(2);
  });

  it('opens on no item when every item is disabled', () => {
    expect(openingIndex([item('Copy', true)], 'ArrowDown')).toBe(-1);
  });

  it('leaves other keys to the button', () => {
    expect(openingIndex(items, 'Enter')).toBeUndefined();
    expect(openingIndex(items, ' ')).toBeUndefined();
    expect(openingIndex(items, 'a')).toBeUndefined();
  });
});

describe('menuKeyAction', () => {
  it('moves past disabled items and wraps at both ends', () => {
    expect(menuKeyAction(items, 1, 'ArrowDown')).toEqual({ kind: 'highlight', index: 2 });
    expect(menuKeyAction(items, 2, 'ArrowDown')).toEqual({ kind: 'highlight', index: 1 });
    expect(menuKeyAction(items, 1, 'ArrowUp')).toEqual({ kind: 'highlight', index: 2 });
    expect(menuKeyAction(items, 2, 'ArrowUp')).toEqual({ kind: 'highlight', index: 1 });
  });

  it('starts at the first or the last enabled item when nothing is highlighted', () => {
    expect(menuKeyAction(items, -1, 'ArrowDown')).toEqual({ kind: 'highlight', index: 1 });
    expect(menuKeyAction(items, -1, 'ArrowUp')).toEqual({ kind: 'highlight', index: 2 });
  });

  it('goes to the first and last enabled items with Home and End', () => {
    expect(menuKeyAction(items, 2, 'Home')).toEqual({ kind: 'highlight', index: 1 });
    expect(menuKeyAction(items, 1, 'End')).toEqual({ kind: 'highlight', index: 2 });
  });

  it('keeps no highlight in a menu without an enabled item', () => {
    const disabled = [item('Copy', true)];
    expect(menuKeyAction(disabled, -1, 'ArrowDown')).toEqual({ kind: 'highlight', index: -1 });
    expect(menuKeyAction(disabled, -1, 'ArrowUp')).toEqual({ kind: 'highlight', index: -1 });
    expect(menuKeyAction(disabled, -1, 'Home')).toEqual({ kind: 'highlight', index: -1 });
  });

  it('activates with Enter and Space, closes with Escape and leaves Tab to the browser', () => {
    expect(menuKeyAction(items, 1, 'Enter')).toEqual({ kind: 'activate' });
    expect(menuKeyAction(items, 1, ' ')).toEqual({ kind: 'activate' });
    expect(menuKeyAction(items, 1, 'Escape')).toEqual({ kind: 'close' });
    expect(menuKeyAction(items, 1, 'Tab')).toBeUndefined();
  });

  it('leaves printable keys to the typeahead', () => {
    expect(menuKeyAction(items, 1, 'r')).toBeUndefined();
  });
});
