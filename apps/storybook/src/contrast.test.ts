import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast.ts';

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBeCloseTo(21, 5);
    expect(contrastRatio('rgb(23, 75, 160)', 'rgb(23, 75, 160)')).toBe(1);
  });

  it('composites a transparent colour onto its background', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)')).toBe(1);
    expect(contrastRatio('rgba(255, 255, 255, 0.2)', 'rgb(23, 75, 160)')).toBeLessThan(3);
  });

  it('matches the ratio of the icon colour on white', () => {
    expect(contrastRatio('rgb(23, 75, 160)', 'rgb(255, 255, 255)')).toBeCloseTo(8.23, 2);
  });
});
