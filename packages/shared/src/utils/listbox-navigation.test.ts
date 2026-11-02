import { describe, expect, it } from 'vitest';

import type { ListboxOption } from '../components/listbox.ts';
import {
  EMPTY_TYPEAHEAD,
  filterItems,
  firstEnabled,
  flattenOptions,
  hasExactLabel,
  indexOfValue,
  isChosen,
  isGrouped,
  lastEnabled,
  moveHighlight,
  normalizeValue,
  toggleValue,
  typeahead,
  TYPEAHEAD_TIMEOUT,
  valuesOf,
} from './listbox-navigation.ts';

const option = (label: string, disabled = false): ListboxOption => ({
  value: label.toLowerCase(),
  label,
  disabled,
});

const options = [
  option('Apple', true),
  option('Banana'),
  option('Blueberry'),
  option('Cherry', true),
  option('Date'),
];

describe('isGrouped and flattenOptions', () => {
  it('tell groups from options and flatten groups in order', () => {
    const groups = [
      { label: 'A', options: [option('Apple')] },
      { options: [option('Banana'), option('Blueberry')] },
    ];
    expect(isGrouped(groups)).toBe(true);
    expect(isGrouped(options)).toBe(false);
    expect(isGrouped([])).toBe(false);
    expect(flattenOptions(groups).map(({ label }) => label)).toEqual([
      'Apple',
      'Banana',
      'Blueberry',
    ]);
    expect(flattenOptions(undefined)).toEqual([]);
  });
});

describe('filterItems and hasExactLabel', () => {
  const fauna = [option('Żółw'), option('Strauß'), option('Zebra')];

  it('keeps the options whose labels contain the query, ignoring case and diacritics', () => {
    expect(filterItems(fauna, 'zolw').map(({ label }) => label)).toEqual(['Żółw']);
    expect(filterItems(fauna, 'STRAUSS').map(({ label }) => label)).toEqual(['Strauß']);
    expect(filterItems(fauna, 'e').map(({ label }) => label)).toEqual(['Zebra']);
    expect(filterItems(fauna, '  ')).toEqual(fauna);
    expect(filterItems(undefined, 'a')).toEqual([]);
  });

  it('drops the groups without a match and keeps the others with their labels', () => {
    const groups = [
      { label: 'Fruit', options: [option('Apple'), option('Banana')] },
      { label: 'Vegetables', options: [option('Carrot')] },
    ];
    expect(filterItems(groups, 'an')).toEqual([{ label: 'Fruit', options: [option('Banana')] }]);
  });

  it('finds a label equal to the query, not one that only contains it', () => {
    expect(hasExactLabel(fauna, ' zolw ')).toBe(true);
    expect(hasExactLabel(fauna, 'zol')).toBe(false);
    expect(hasExactLabel([{ options: fauna }], 'ZEBRA')).toBe(true);
  });
});

describe('values', () => {
  it('read a value of either shape and drop empty strings', () => {
    expect(valuesOf('a')).toEqual(['a']);
    expect(valuesOf('')).toEqual([]);
    expect(valuesOf(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(valuesOf(undefined)).toEqual([]);
  });

  it('normalize a value to the shape of the list', () => {
    expect(normalizeValue(['b', 'a'], false)).toBe('b');
    expect(normalizeValue([], false)).toBe('');
    expect(normalizeValue('a', true)).toEqual(['a']);
    expect(normalizeValue(['a', 'a', 'b'], true)).toEqual(['a', 'b']);
  });

  it('never choose the empty value', () => {
    expect(isChosen('', '')).toBe(false);
    expect(isChosen(['a', 'b'], 'b')).toBe(true);
    expect(isChosen('a', 'b')).toBe(false);
  });

  it('toggle a value without changing the list it was given', () => {
    const values = ['a'];
    expect(toggleValue(values, 'b')).toEqual(['a', 'b']);
    expect(toggleValue(values, 'a')).toEqual([]);
    expect(values).toEqual(['a']);
  });

  it('find the option of a value', () => {
    expect(indexOfValue(options, 'date')).toBe(4);
    expect(indexOfValue(options, 'fig')).toBe(-1);
    expect(indexOfValue([{ value: '', label: '' }], '')).toBe(-1);
  });
});

describe('moveHighlight', () => {
  it('skips disabled options and stops at the ends', () => {
    expect(moveHighlight(options, 1, 'ArrowDown')).toBe(2);
    expect(moveHighlight(options, 2, 'ArrowDown')).toBe(4);
    expect(moveHighlight(options, 4, 'ArrowDown')).toBe(4);
    expect(moveHighlight(options, 1, 'ArrowUp')).toBe(1);
  });

  it('starts at the first or last enabled option without a highlight', () => {
    expect(moveHighlight(options, -1, 'ArrowDown')).toBe(1);
    expect(moveHighlight(options, -1, 'ArrowUp')).toBe(4);
    expect(firstEnabled(options)).toBe(1);
    expect(lastEnabled(options)).toBe(4);
  });

  it('goes to the ends with Home and End', () => {
    expect(moveHighlight(options, 4, 'Home')).toBe(1);
    expect(moveHighlight(options, 1, 'End')).toBe(4);
  });

  it('moves by a page and lands on an enabled option', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      option(`Option ${String(index)}`, index === 10),
    );
    expect(moveHighlight(many, 0, 'PageDown')).toBe(9);
    expect(moveHighlight(many, 25, 'PageDown')).toBe(29);
    expect(moveHighlight(many, 20, 'PageUp')).toBe(11);
    expect(moveHighlight(many, 3, 'PageUp')).toBe(0);
  });

  it('ignores other keys and lists where nothing is enabled', () => {
    expect(moveHighlight(options, 1, 'Enter')).toBeUndefined();
    expect(moveHighlight([option('A', true)], -1, 'ArrowDown')).toBe(-1);
  });
});

describe('typeahead', () => {
  const fruit = [
    option('Banana'),
    option('Blueberry'),
    option('Cherry'),
    option('Żurawina'),
    option('Bilberry', true),
  ];

  it('moves to the next option that starts with a letter, ignoring case and diacritics', () => {
    expect(typeahead(EMPTY_TYPEAHEAD, 'c', 0, fruit, -1)?.index).toBe(2);
    expect(typeahead(EMPTY_TYPEAHEAD, 'z', 0, fruit, -1)?.index).toBe(3);
  });

  it('cycles through the options of a repeated letter and skips disabled ones', () => {
    const first = typeahead(EMPTY_TYPEAHEAD, 'b', 0, fruit, -1);
    expect(first?.index).toBe(0);
    const second = first && typeahead(first.state, 'b', 100, fruit, first.index);
    expect(second?.index).toBe(1);
    const third = second && typeahead(second.state, 'b', 200, fruit, second.index);
    expect(third?.index).toBe(0);
  });

  it('adds up letters typed in time and starts again after the timeout', () => {
    const first = typeahead(EMPTY_TYPEAHEAD, 'b', 0, fruit, -1);
    const second = first && typeahead(first.state, 'l', 100, fruit, first.index);
    expect(second?.index).toBe(1);
    expect(second?.state.query).toBe('bl');
    const late =
      second && typeahead(second.state, 'c', 100 + TYPEAHEAD_TIMEOUT + 1, fruit, second.index);
    expect(late?.state.query).toBe('c');
    expect(late?.index).toBe(2);
  });

  it('keeps the highlight when nothing matches and ignores keys that are not one character', () => {
    expect(typeahead(EMPTY_TYPEAHEAD, 'x', 0, fruit, 2)?.index).toBe(2);
    expect(typeahead(EMPTY_TYPEAHEAD, 'Enter', 0, fruit, 2)).toBeUndefined();
    expect(typeahead(EMPTY_TYPEAHEAD, ' ', 0, fruit, 2)).toBeUndefined();
  });

  it('takes a space only inside a query typed in time', () => {
    const typed = { query: 'b', time: 0 };
    expect(typeahead(typed, ' ', 100, fruit, 0)?.state.query).toBe('b ');
    expect(typeahead(typed, ' ', TYPEAHEAD_TIMEOUT + 1, fruit, 0)).toBeUndefined();
  });
});
