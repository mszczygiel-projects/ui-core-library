/**
 * Every module has to load where no browser exists, such as in a server render, and to change
 * nothing as it loads. While a module loads, the globals of a browser throw, and the
 * global object and the built-ins of the language must be the same afterwards.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'matchMedia',
];

// The globals of the language, as a fresh realm has them: Object, String, Intl, Math and so on.
// The console belongs to the host, and the test runner redirects it.
const BUILT_INS = (runInNewContext('Object.getOwnPropertyNames(globalThis)') as string[]).filter(
  (name) => name !== 'console',
);

// Deep enough for a method of a prototype, such as Intl.DateTimeFormat.prototype.formatToParts.
const BUILT_IN_DEPTH = 3;

interface Snapshot {
  readonly target: object;
  readonly properties: ReadonlyMap<PropertyKey, PropertyDescriptor>;
}

function isObject(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function propertiesOf(target: object): Map<PropertyKey, PropertyDescriptor> {
  const properties = new Map<PropertyKey, PropertyDescriptor>();
  for (const key of Reflect.ownKeys(target)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor !== undefined) {
      properties.set(key, descriptor);
    }
  }
  return properties;
}

/**
 * The own properties of the global object, and of every object the built-ins reach through theirs,
 * by path. Descriptors are read, never values, so no getter runs.
 */
function snapshot(): Map<string, Snapshot> {
  const snapshots = new Map<string, Snapshot>();
  const seen = new Set<object>();
  const visit = (target: object, path: string, depth: number): void => {
    if (seen.has(target)) {
      return;
    }
    seen.add(target);
    const properties = propertiesOf(target);
    snapshots.set(path, { target, properties });
    if (depth > 0) {
      for (const [key, descriptor] of properties) {
        const value: unknown = descriptor.value;
        if (isObject(value)) {
          visit(value, `${path}.${String(key)}`, depth - 1);
        }
      }
    }
  };
  visit(globalThis, 'globalThis', 0);
  for (const name of BUILT_INS) {
    const value: unknown = Reflect.getOwnPropertyDescriptor(globalThis, name)?.value;
    if (isObject(value)) {
      visit(value, name, BUILT_IN_DEPTH);
    }
  }
  return snapshots;
}

function sameDescriptor(before?: PropertyDescriptor, after?: PropertyDescriptor): boolean {
  if (before === undefined || after === undefined) {
    return before === after;
  }
  return (
    Object.is(before.value, after.value) &&
    before.get === after.get &&
    before.set === after.set &&
    before.writable === after.writable &&
    before.enumerable === after.enumerable &&
    before.configurable === after.configurable
  );
}

/** The paths of the properties that were added, removed or replaced since the snapshot. */
function changesSince(snapshots: ReadonlyMap<string, Snapshot>): string[] {
  const changes: string[] = [];
  for (const [path, { target, properties }] of snapshots) {
    const current = propertiesOf(target);
    for (const key of new Set([...properties.keys(), ...current.keys()])) {
      if (!sameDescriptor(properties.get(key), current.get(key))) {
        changes.push(`${path}.${String(key)}`);
      }
    }
  }
  return changes;
}

// Node.js creates some globals, such as FormData, when they are first read, and creating them
// defines more. A first snapshot reads them all, so the snapshots of the tests start settled.
snapshot();

interface Manifest {
  readonly exports: Readonly<Record<string, unknown>>;
}

const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, '../package.json'), 'utf8'),
) as Manifest;
const modules = Object.keys(manifest.exports)
  .filter((subpath) => subpath !== './package.json')
  .map((subpath) => subpath.slice('./'.length));

describe.each(modules)('the module %s', (name) => {
  it('loads without a browser, and leaves the globals and the built-ins as they were', async () => {
    vi.resetModules();
    const originals = new Map(
      BROWSER_GLOBALS.map((global) => [
        global,
        Object.getOwnPropertyDescriptor(globalThis, global),
      ]),
    );
    for (const global of BROWSER_GLOBALS) {
      Object.defineProperty(globalThis, global, {
        configurable: true,
        get() {
          throw new Error(`${name} reads ${global} as it loads`);
        },
      });
    }
    const now = vi.spyOn(Date, 'now');
    const random = vi.spyOn(Math, 'random');
    const before = snapshot();
    try {
      await import(new URL(`./${name}.ts`, import.meta.url).href);
      expect(changesSince(before)).toEqual([]);
      expect(now).not.toHaveBeenCalled();
      expect(random).not.toHaveBeenCalled();
    } finally {
      now.mockRestore();
      random.mockRestore();
      for (const [global, descriptor] of originals) {
        if (descriptor === undefined) {
          Reflect.deleteProperty(globalThis, global);
        } else {
          Object.defineProperty(globalThis, global, descriptor);
        }
      }
    }
  });
});

describe('the snapshot of the globals', () => {
  it('sees a global that is replaced, and a prototype or a built-in that is patched', () => {
    const before = snapshot();
    const patches: [object, string][] = [
      [globalThis, 'Intl'],
      [String.prototype, 'includes'],
      [String.prototype, 'fold'],
      [Intl.DateTimeFormat.prototype, 'formatToParts'],
    ];
    const originals = patches.map(([target, key]) => Reflect.getOwnPropertyDescriptor(target, key));
    try {
      for (const [target, key] of patches) {
        Reflect.set(target, key, () => undefined);
      }
      expect(changesSince(before).sort()).toEqual(
        [
          'globalThis.Intl',
          'String.prototype.includes',
          'String.prototype.fold',
          'Intl.DateTimeFormat.prototype.formatToParts',
        ].sort(),
      );
    } finally {
      patches.forEach(([target, key], index) => {
        const descriptor = originals[index];
        if (descriptor === undefined) {
          Reflect.deleteProperty(target, key);
        } else {
          Object.defineProperty(target, key, descriptor);
        }
      });
    }
    expect(changesSince(before)).toEqual([]);
  });
});
