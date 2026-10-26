import { describe, expect, it } from 'vitest';

import { exportName, isIconName } from './names.ts';

describe('isIconName', () => {
  it('accepts kebab case', () => {
    for (const name of ['close', 'chevron-down', 'arrow-2', '2fa']) {
      expect(isIconName(name), name).toBe(true);
    }
  });

  it('rejects anything else', () => {
    for (const name of [
      'Close',
      'icon_close',
      'chevron--down',
      '-close',
      'close-',
      'icon/close',
      '',
    ]) {
      expect(isIconName(name), name).toBe(false);
    }
  });
});

describe('exportName', () => {
  it('prefixes the name in camel case', () => {
    expect(exportName('close')).toBe('iconClose');
    expect(exportName('chevron-down')).toBe('iconChevronDown');
    expect(exportName('eye-slash')).toBe('iconEyeSlash');
  });

  it('keeps names that are reserved words or start with a digit valid identifiers', () => {
    expect(exportName('delete')).toBe('iconDelete');
    expect(exportName('arrow-2')).toBe('iconArrow2');
    expect(exportName('2fa')).toBe('icon2fa');
  });
});
