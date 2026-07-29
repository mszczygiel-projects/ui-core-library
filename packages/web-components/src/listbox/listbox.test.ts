import { expect } from '@open-wc/testing';
import {
  buildRows,
  firstEnabledRow,
  flattenOptions,
  isGroupedItems,
  isOptionSelected,
  listboxOptionId,
  nextEnabledRow,
  rowIndexOfValue,
  toggleValue,
} from './listbox.js';
import type { ListboxOption, ListboxOptionGroup } from './listbox.js';

const flat: ListboxOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo', disabled: true },
  { value: 'c', label: 'Charlie' },
];

const grouped: ListboxOptionGroup[] = [
  { label: 'Recent', options: [{ value: 'a', label: 'Alpha' }] },
  {
    label: 'All',
    options: [
      { value: 'b', label: 'Bravo', disabled: true },
      { value: 'c', label: 'Charlie' },
    ],
  },
];

describe('listbox helpers', () => {
  describe('isGroupedItems', () => {
    it('detects grouped and flat shapes', () => {
      expect(isGroupedItems(grouped)).to.equal(true);
      expect(isGroupedItems(flat)).to.equal(false);
    });

    it('treats an empty list as flat', () => {
      expect(isGroupedItems([])).to.equal(false);
    });
  });

  describe('flattenOptions', () => {
    it('returns flat items unchanged', () => {
      expect(flattenOptions(flat).map((o) => o.value)).to.deep.equal(['a', 'b', 'c']);
    });

    it('flattens groups in order', () => {
      expect(flattenOptions(grouped).map((o) => o.value)).to.deep.equal(['a', 'b', 'c']);
    });

    it('tolerates undefined', () => {
      expect(flattenOptions(undefined)).to.deep.equal([]);
    });
  });

  describe('buildRows', () => {
    it('builds one row per option, indexed across groups', () => {
      const rows = buildRows(grouped);
      expect(rows.length).to.equal(3);
      expect(rows.map((r) => r.index)).to.deep.equal([0, 1, 2]);
      expect(rows.every((r) => r.kind === 'option')).to.equal(true);
    });

    it('appends the create row last when a label is given', () => {
      const rows = buildRows(flat, 'Create "x"');
      expect(rows.length).to.equal(4);
      expect(rows[3].kind).to.equal('create');
      expect(rows[3].index).to.equal(3);
    });

    it('omits the create row without a label', () => {
      expect(buildRows(flat).some((r) => r.kind === 'create')).to.equal(false);
    });
  });

  describe('nextEnabledRow', () => {
    it('skips disabled options going forward', () => {
      const rows = buildRows(flat);
      expect(nextEnabledRow(rows, 0, 1)).to.equal(2);
    });

    it('skips disabled options going backward', () => {
      const rows = buildRows(flat);
      expect(nextEnabledRow(rows, 2, -1)).to.equal(0);
    });

    it('stops at the ends instead of wrapping', () => {
      const rows = buildRows(flat);
      expect(nextEnabledRow(rows, 2, 1)).to.equal(2);
      expect(nextEnabledRow(rows, 0, -1)).to.equal(0);
    });

    it('treats the create row as selectable', () => {
      const rows = buildRows(flat, 'Create');
      expect(nextEnabledRow(rows, 2, 1)).to.equal(3);
    });

    it('stays put when every later option is disabled', () => {
      const rows = buildRows([
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo', disabled: true },
      ]);
      expect(nextEnabledRow(rows, 0, 1)).to.equal(0);
    });
  });

  describe('firstEnabledRow', () => {
    it('skips a leading disabled option', () => {
      const rows = buildRows([
        { value: 'a', label: 'Alpha', disabled: true },
        { value: 'b', label: 'Bravo' },
      ]);
      expect(firstEnabledRow(rows)).to.equal(1);
    });

    it('returns -1 when everything is disabled', () => {
      const rows = buildRows([{ value: 'a', label: 'Alpha', disabled: true }]);
      expect(firstEnabledRow(rows)).to.equal(-1);
    });
  });

  describe('rowIndexOfValue', () => {
    it('finds the row holding a value', () => {
      expect(rowIndexOfValue(buildRows(grouped), 'c')).to.equal(2);
    });

    it('returns -1 for an unknown value', () => {
      expect(rowIndexOfValue(buildRows(flat), 'zzz')).to.equal(-1);
    });
  });

  describe('isOptionSelected', () => {
    it('compares single values', () => {
      expect(isOptionSelected('a', 'a')).to.equal(true);
      expect(isOptionSelected('a', 'b')).to.equal(false);
    });

    it('never marks the empty value as selected', () => {
      expect(isOptionSelected('', '')).to.equal(false);
    });

    it('checks membership for multi-select', () => {
      expect(isOptionSelected(['a', 'c'], 'c')).to.equal(true);
      expect(isOptionSelected(['a', 'c'], 'b')).to.equal(false);
    });
  });

  describe('toggleValue', () => {
    it('adds a missing value', () => {
      expect(toggleValue(['a'], 'b')).to.deep.equal(['a', 'b']);
    });

    it('removes a present value', () => {
      expect(toggleValue(['a', 'b'], 'a')).to.deep.equal(['b']);
    });

    it('treats undefined as empty', () => {
      expect(toggleValue(undefined, 'a')).to.deep.equal(['a']);
    });

    it('does not mutate the input array', () => {
      const input = ['a'];
      toggleValue(input, 'b');
      expect(input).to.deep.equal(['a']);
    });
  });

  describe('listboxOptionId', () => {
    it('builds ids from the prefix and index', () => {
      expect(listboxOptionId('season', 2)).to.equal('season-opt-2');
    });
  });
});
