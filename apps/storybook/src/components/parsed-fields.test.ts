import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const packages = join(import.meta.dirname, '..', '..', '..', '..', 'packages');

describe('the shared parsed-field algorithms', () => {
  it.each([
    ['react/src/number-field/NumberField.tsx', 'numeric', 'parseNumberText', 'validateNumber'],
    [
      'web-components/src/number-field/number-field.tsx',
      'numeric',
      'parseNumberText',
      'validateNumber',
    ],
    ['react/src/date-field/DateField.tsx', 'date', 'parseDateText', 'validateDate'],
    ['web-components/src/date-field/date-field.tsx', 'date', 'parseDateText', 'validateDate'],
  ])('%s imports and uses the shared parser and validator', (path, module, parser, validator) => {
    const source = readFileSync(join(packages, path), 'utf8');
    const imports = new RegExp(
      `import \\{([^}]+)\\} from '@mszczygiel-projects/ui-core-shared/${module}'`,
    ).exec(source)?.[1];
    expect(imports).toContain(parser);
    expect(imports).toContain(validator);
    expect(source).toMatch(new RegExp(`(?:parse: ${parser}|${parser}\\()`));
    expect(source).toContain(`${validator}(`);
    expect(source).not.toMatch(/(?:parseFloat|parseInt|new Date)\(/);
  });
});
