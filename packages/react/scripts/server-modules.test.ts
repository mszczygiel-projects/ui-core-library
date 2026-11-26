import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// A server component passes no function to a client component, so these modules stay free of the
// directive: LinkButton takes `render` from a server component only while it runs on the server.
const SERVER_MODULES = [
  'link-button/LinkButton.tsx',
  'internal/class-names.ts',
  'internal/renders-content.ts',
];

describe('modules that run in a server component', () => {
  it.each(SERVER_MODULES)('%s is not a client module and calls no hook', (path) => {
    const source = readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
    expect(source).not.toMatch(/^['"]use client['"]/m);
    expect(source).not.toMatch(/\buse[A-Z]\w*\s*[(<]/);
  });
});
