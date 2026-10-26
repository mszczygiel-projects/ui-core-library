import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

import rule from './no-literal-text.ts';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const literal = (count = 1) => Array.from({ length: count }, () => ({ messageId: 'literal' }));

tester.run('no-literal-text in JSX', rule, {
  valid: [
    'const a = <span role="progressbar" aria-label={label} />;',
    'const a = <span className="ui-loader">{children}</span>;',
    'const a = <span aria-hidden="true">/</span>;',
    'const a = <span data-part="indicator" />;',
    'const a = <ui-loader label={this.loadingLabel} />;',
  ],
  invalid: [
    { code: 'const a = <span>Loading</span>;', errors: literal() },
    { code: 'const a = <button aria-label="Close" />;', errors: literal() },
    { code: "const a = <input placeholder={'Search'} />;", errors: literal() },
    { code: "const a = <span>{'Loading'}</span>;", errors: literal() },
    { code: 'const a = <>Ładowanie</>;', errors: literal() },
    { code: 'const a = <img alt={`Logo`} />;', errors: literal() },
    { code: 'const a = <ui-loader label="Loading" />;', errors: literal() },
    { code: 'const a = <span>Page {page}</span>;', errors: literal() },
  ],
});
