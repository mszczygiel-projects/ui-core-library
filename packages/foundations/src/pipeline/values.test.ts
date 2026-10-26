import { describe, expect, it } from 'vitest';

import { formatBoolean, formatNumber, formatString } from './values.ts';

describe('formatNumber', () => {
  it('turns pixels into rem at a 16px root', () => {
    expect(formatNumber(['spacing', '4'], 16)).toBe('1rem');
    expect(formatNumber(['spacing', '2'], 4)).toBe('0.25rem');
    expect(formatNumber(['size', 'icon'], 24)).toBe('1.5rem');
  });

  it('writes zero without a unit, whatever the path', () => {
    expect(formatNumber(['spacing', '0'], 0)).toBe('0');
    expect(formatNumber(['font-weight', 'zero'], 0)).toBe('0');
  });

  it('keeps font weights unitless', () => {
    expect(formatNumber(['font-weight', 'bold'], 700)).toBe('700');
    expect(formatNumber(['typography', 'body', 'font-weight'], 400)).toBe('400');
  });

  it('writes tracking in em and durations in ms', () => {
    expect(formatNumber(['tracking', 'tight'], -0.025)).toBe('-0.025em');
    expect(formatNumber(['letter-spacing', 'wide'], 0.05)).toBe('0.05em');
    expect(formatNumber(['notification', 'letter-spacing'], 0.5)).toBe('0.5em');
    expect(formatNumber(['duration', 'fast'], 150)).toBe('150ms');
  });
});

describe('formatString', () => {
  it('quotes font families, the font/* values of Brand among them', () => {
    expect(formatString(['typography', 'body', 'font-family'], 'Inter')).toBe('"Inter"');
    expect(formatString(['font', 'heading'], 'Playfair Display')).toBe('"Playfair Display"');
  });

  it('turns tracking percentages into em, which CSS accepts', () => {
    expect(formatString(['tracking', 'widest'], '10%')).toBe('0.1em');
    expect(formatString(['tracking', 'wide'], '2.5%')).toBe('0.025em');
    expect(formatString(['tracking', 'tight'], '-2.5%')).toBe('-0.025em');
    expect(formatString(['notification', 'letter-spacing'], '10%')).toBe('0.1em');
  });

  it('writes zero tracking as a bare 0 and reads numbers that arrived as strings', () => {
    expect(formatString(['tracking', 'normal'], '0')).toBe('0');
    expect(formatString(['tracking', 'normal'], '0%')).toBe('0');
    expect(formatString(['tracking', 'widest'], '0.5')).toBe('0.5em');
  });

  it('passes other strings through', () => {
    expect(formatString(['tracking', 'widest'], 'normal')).toBe('normal');
    expect(formatString(['ring', 'style'], 'solid')).toBe('solid');
    expect(formatString(['shadow', 'elevation', '1'], '0 1px 2px 0 rgba(0,0,0,0.05)')).toBe(
      '0 1px 2px 0 rgba(0,0,0,0.05)',
    );
  });
});

describe('formatBoolean', () => {
  it('turns a text-uppercase flag into uppercase or none', () => {
    expect(formatBoolean(['text-uppercase', 'button'], true)).toBe('uppercase');
    expect(formatBoolean(['text-uppercase', 'button'], false)).toBe('none');
    expect(formatBoolean(['typography', 'eyebrow', 'text-uppercase'], true)).toBe('uppercase');
  });

  it('turns a text-underline flag into underline or none', () => {
    expect(formatBoolean(['text-underline', 'link'], true)).toBe('underline');
    expect(formatBoolean(['text-underline', 'link'], false)).toBe('none');
  });

  it('writes other booleans as true or false', () => {
    expect(formatBoolean(['some', 'flag'], true)).toBe('true');
    expect(formatBoolean(['some', 'flag'], false)).toBe('false');
  });
});
