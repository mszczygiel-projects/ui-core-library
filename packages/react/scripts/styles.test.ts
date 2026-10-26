import { describe, expect, it } from 'vitest';

import { assembleStyles, LAYER_ORDER } from './styles.ts';

describe('assembleStyles', () => {
  it('puts every stylesheet into components.ui-core, after the order of the layers', () => {
    const css = assembleStyles([
      { path: 'loader/loader.css', css: '.ui-loader { display: inline-flex; }\n' },
      { path: 'button/button.css', css: '.ui-button { display: inline-flex; }' },
    ]);
    expect(css.indexOf(LAYER_ORDER)).toBeLessThan(css.indexOf('@layer components.ui-core {'));
    expect(css.indexOf('button/button.css')).toBeLessThan(css.indexOf('loader/loader.css'));
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });

  it('writes the same file for the same stylesheets in any order', () => {
    const a = { path: 'a.css', css: '.a {}' };
    const b = { path: 'b.css', css: '.b {}' };
    expect(assembleStyles([a, b])).toBe(assembleStyles([b, a]));
  });
});
