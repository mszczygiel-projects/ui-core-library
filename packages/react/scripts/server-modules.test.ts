import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// These modules stay free of the directive. A server component passes no function to a client
// component, so LinkButton takes `render` from one only while it runs on the server, and Icon, which
// is markup alone, adds no code to the client.
const SERVER_MODULES = [
  'icon/Icon.tsx',
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
