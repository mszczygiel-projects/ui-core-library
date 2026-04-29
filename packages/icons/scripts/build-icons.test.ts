import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  toPascalCase,
  optimizeSvg,
  buildReactComponent,
  ensureIconPrefixInSvgFilenames,
} from './icons-transformer.ts';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'icons-test-'));
}

function writeSvg(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, 'utf8');
}

const MINIMAL_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>`;

const SVG_WITH_DIMENSIONS = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>`;

const SVG_WITH_HARDCODED_FILL = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#174BA0" d="M0 0h24v24H0z"/></svg>`;

const SVG_WITH_HARDCODED_STROKE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke="#000000" d="M0 0h24v24H0z"/></svg>`;

const SVG_WITH_FILL_NONE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#aabbcc" d="M0 0h24v24H0z"/></svg>`;

const SVG_WITH_CURRENT_COLOR = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 0h24v24H0z"/></svg>`;

// ─── 1. toPascalCase — naming convention ──────────────────────────────────────

describe('toPascalCase', () => {
  it('converts single-segment name', () => {
    expect(toPascalCase('icon')).toBe('Icon');
  });

  it('converts two-segment kebab name', () => {
    expect(toPascalCase('icon-alert')).toBe('IconAlert');
  });

  it('converts multi-segment kebab name', () => {
    expect(toPascalCase('icon-chevron-down')).toBe('IconChevronDown');
  });

  it('handles names with many segments', () => {
    expect(toPascalCase('icon-shopping-bag')).toBe('IconShoppingBag');
    expect(toPascalCase('icon-eye-slash')).toBe('IconEyeSlash');
  });

  it('capitalises each segment independently', () => {
    expect(toPascalCase('a-b-c')).toBe('ABC');
  });
});

// ─── 2. optimizeSvg — SVGO pipeline ───────────────────────────────────────────

describe('optimizeSvg', () => {
  it('removes width and height attributes from <svg>', () => {
    const result = optimizeSvg(SVG_WITH_DIMENSIONS);
    expect(result).not.toMatch(/\swidth=/);
    expect(result).not.toMatch(/\sheight=/);
  });

  it('preserves viewBox attribute', () => {
    const result = optimizeSvg(SVG_WITH_DIMENSIONS);
    expect(result).toContain('viewBox="0 0 24 24"');
  });

  it('replaces hardcoded fill color with currentColor', () => {
    const result = optimizeSvg(SVG_WITH_HARDCODED_FILL);
    expect(result).toContain('fill="currentColor"');
    expect(result).not.toContain('#174BA0');
  });

  it('replaces hardcoded stroke color with currentColor', () => {
    const result = optimizeSvg(SVG_WITH_HARDCODED_STROKE);
    expect(result).toContain('stroke="currentColor"');
    expect(result).not.toContain('#000000');
  });

  it('keeps fill="none" unchanged', () => {
    const result = optimizeSvg(SVG_WITH_FILL_NONE);
    expect(result).toContain('fill="none"');
  });

  it('replaces stroke color but preserves fill="none" in the same element', () => {
    const result = optimizeSvg(SVG_WITH_FILL_NONE);
    expect(result).toContain('fill="none"');
    expect(result).toContain('stroke="currentColor"');
    expect(result).not.toContain('#aabbcc');
  });

  it('leaves fill="currentColor" unchanged', () => {
    const result = optimizeSvg(SVG_WITH_CURRENT_COLOR);
    expect(result).toContain('fill="currentColor"');
  });

  it('accepts an optional filePath without throwing', () => {
    expect(() => optimizeSvg(MINIMAL_SVG, '/tmp/icon-test.svg')).not.toThrow();
  });

  it('returns a valid SVG string', () => {
    const result = optimizeSvg(MINIMAL_SVG);
    expect(result.trim()).toMatch(/^<svg/);
    expect(result.trim()).toMatch(/<\/svg>$/);
  });

  it('replaces stop-color with currentColor', () => {
    const svgWithStopColor = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#ff0000"/></linearGradient></defs><rect fill="url(#g)" width="24" height="24"/></svg>`;
    const result = optimizeSvg(svgWithStopColor);
    expect(result).toContain('stop-color="currentColor"');
    expect(result).not.toContain('#ff0000');
  });
});

// ─── 3. ensureIconPrefixInSvgFilenames — filesystem renaming ──────────────────

describe('ensureIconPrefixInSvgFilenames', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renames a file without icon- prefix', () => {
    writeSvg(tmpDir, 'alert.svg', MINIMAL_SVG);
    ensureIconPrefixInSvgFilenames(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'icon-alert.svg'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'alert.svg'))).toBe(false);
  });

  it('renames multiple files without prefix', () => {
    writeSvg(tmpDir, 'alert.svg', MINIMAL_SVG);
    writeSvg(tmpDir, 'home.svg', MINIMAL_SVG);
    ensureIconPrefixInSvgFilenames(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'icon-alert.svg'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'icon-home.svg'))).toBe(true);
  });

  it('leaves files that already have icon- prefix unchanged', () => {
    writeSvg(tmpDir, 'icon-alert.svg', MINIMAL_SVG);
    ensureIconPrefixInSvgFilenames(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'icon-alert.svg'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'icon-icon-alert.svg'))).toBe(false);
  });

  it('handles a mix of prefixed and unprefixed files', () => {
    writeSvg(tmpDir, 'icon-cart.svg', MINIMAL_SVG);
    writeSvg(tmpDir, 'search.svg', MINIMAL_SVG);
    ensureIconPrefixInSvgFilenames(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'icon-cart.svg'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'icon-search.svg'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'search.svg'))).toBe(false);
  });

  it('throws when renaming would overwrite an existing file', () => {
    writeSvg(tmpDir, 'alert.svg', MINIMAL_SVG);
    writeSvg(tmpDir, 'icon-alert.svg', MINIMAL_SVG);
    expect(() => ensureIconPrefixInSvgFilenames(tmpDir)).toThrow(
      'Cannot rename alert.svg to icon-alert.svg: target file already exists.',
    );
  });

  it('ignores non-svg files in the directory', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Icons');
    writeSvg(tmpDir, 'icon-home.svg', MINIMAL_SVG);
    expect(() => ensureIconPrefixInSvgFilenames(tmpDir)).not.toThrow();
    expect(fs.existsSync(path.join(tmpDir, 'readme.md'))).toBe(true);
  });

  it('does nothing in an empty directory', () => {
    expect(() => ensureIconPrefixInSvgFilenames(tmpDir)).not.toThrow();
  });
});

// ─── 4. buildReactComponent — SVGR output ─────────────────────────────────────

describe('buildReactComponent', () => {
  it('generates a named export function with the given component name', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconAlert');
    expect(result).toContain('export function IconAlert(');
  });

  it('imports React at the top of the file', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconHome');
    expect(result).toContain("import * as React from 'react'");
  });

  it('includes a return statement with JSX', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconSearch');
    expect(result).toContain('return');
    expect(result).toContain('<svg');
  });

  it('spreads props onto the root svg element', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconClose');
    expect(result).toMatch(/\.\.\.props/);
  });

  it('uses component name in the function signature', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconChevronDown');
    expect(result).toContain('IconChevronDown');
  });

  it('does not use auto-import JSX pragma (classic runtime)', async () => {
    const result = await buildReactComponent(MINIMAL_SVG, 'IconStar');
    expect(result).not.toContain('_jsx(');
    expect(result).not.toContain('jsx as _jsx');
  });
});

// ─── 5. Integration: full build pipeline ──────────────────────────────────────

describe('buildIcons integration — dist output', async () => {
  let svgDir: string;
  let distDir: string;
  let reactDistDir: string;

  const ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L2 7l10 5 10-5-10-5z" fill="#174BA0" stroke="#000"/>
</svg>`;

  beforeEach(async () => {
    const base = makeTmpDir();
    svgDir = path.join(base, 'svg');
    distDir = path.join(base, 'dist');
    reactDistDir = path.join(distDir, 'react');
    fs.mkdirSync(svgDir, { recursive: true });
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(reactDistDir, { recursive: true });

    writeSvg(svgDir, 'icon-alert.svg', ICON_SVG);
    writeSvg(svgDir, 'icon-home.svg', ICON_SVG);
  });

  afterEach(() => {
    fs.rmSync(path.dirname(svgDir), { recursive: true, force: true });
  });

  async function runBuild() {
    ensureIconPrefixInSvgFilenames(svgDir);
    const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg')).sort();

    const entries: { iconName: string; componentName: string; svg: string }[] = [];
    for (const file of files) {
      const iconName = file.replace(/\.svg$/, '');
      const componentName = toPascalCase(iconName);
      const raw = fs.readFileSync(path.join(svgDir, file), 'utf8');
      const svg = optimizeSvg(raw, path.join(svgDir, file));
      entries.push({ iconName, componentName, svg });
    }

    const iconNamesUnion = entries.map(e => `'${e.iconName}'`).join(' | ');
    fs.writeFileSync(path.join(distDir, 'icon-names.d.ts'), `export type IconName = ${iconNamesUnion};\n`);

    const mapEntries = entries.map(e => `  ${JSON.stringify(e.iconName)}: ${JSON.stringify(e.svg)},`).join('\n');
    fs.writeFileSync(path.join(distDir, 'svg-map.js'), `export const svgMap = {\n${mapEntries}\n};\n`);
    fs.writeFileSync(
      path.join(distDir, 'svg-map.d.ts'),
      `import type { IconName } from './icon-names.js';\nexport declare const svgMap: Record<IconName, string>;\n`,
    );

    const barrelExports: string[] = [];
    for (const { componentName, svg } of entries) {
      const jsx = await buildReactComponent(svg, componentName);
      fs.writeFileSync(path.join(reactDistDir, `${componentName}.jsx`), jsx);
      fs.writeFileSync(
        path.join(reactDistDir, `${componentName}.d.ts`),
        `import * as React from 'react';\nexport declare function ${componentName}(props: React.SVGProps<SVGSVGElement>): React.JSX.Element;\n`,
      );
      barrelExports.push(`export { ${componentName} } from './${componentName}.jsx';`);
    }

    fs.writeFileSync(path.join(reactDistDir, 'index.js'), barrelExports.join('\n') + '\n');
    const dtsExports = entries.map(e => `export { ${e.componentName} } from './${e.componentName}.js';`).join('\n');
    fs.writeFileSync(path.join(reactDistDir, 'index.d.ts'), dtsExports + '\n');

    return entries;
  }

  it('generates icon-names.d.ts with a union of icon names', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(distDir, 'icon-names.d.ts'), 'utf8');
    expect(content).toContain("'icon-alert'");
    expect(content).toContain("'icon-home'");
    expect(content).toMatch(/^export type IconName = /);
  });

  it('generates svg-map.js with all SVG strings', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(distDir, 'svg-map.js'), 'utf8');
    expect(content).toContain('"icon-alert"');
    expect(content).toContain('"icon-home"');
    expect(content).toContain('export const svgMap = {');
  });

  it('generates svg-map.d.ts referencing icon-names.js', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(distDir, 'svg-map.d.ts'), 'utf8');
    expect(content).toContain("from './icon-names.js'");
    expect(content).toContain('Record<IconName, string>');
  });

  it('generates a .jsx and .d.ts file for each icon', async () => {
    await runBuild();
    expect(fs.existsSync(path.join(reactDistDir, 'IconAlert.jsx'))).toBe(true);
    expect(fs.existsSync(path.join(reactDistDir, 'IconAlert.d.ts'))).toBe(true);
    expect(fs.existsSync(path.join(reactDistDir, 'IconHome.jsx'))).toBe(true);
    expect(fs.existsSync(path.join(reactDistDir, 'IconHome.d.ts'))).toBe(true);
  });

  it('generates react/index.js with named exports', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(reactDistDir, 'index.js'), 'utf8');
    expect(content).toContain("export { IconAlert } from './IconAlert.jsx'");
    expect(content).toContain("export { IconHome } from './IconHome.jsx'");
  });

  it('generates react/index.d.ts with type exports', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(reactDistDir, 'index.d.ts'), 'utf8');
    expect(content).toContain("export { IconAlert } from './IconAlert.js'");
    expect(content).toContain("export { IconHome } from './IconHome.js'");
  });

  it('SVG content in svg-map has no hardcoded colors — only currentColor or none', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(distDir, 'svg-map.js'), 'utf8');
    expect(content).not.toMatch(/fill="#[0-9a-fA-F]+"/);
    expect(content).not.toMatch(/stroke="#[0-9a-fA-F]+"/);
  });

  it('SVG content in svg-map has no width or height attributes', async () => {
    await runBuild();
    const content = fs.readFileSync(path.join(distDir, 'svg-map.js'), 'utf8');
    expect(content).not.toMatch(/<svg[^>]+width=/);
    expect(content).not.toMatch(/<svg[^>]+height=/);
  });

  it('renames unprefixed svg files before processing', async () => {
    writeSvg(svgDir, 'search.svg', ICON_SVG);
    await runBuild();
    expect(fs.existsSync(path.join(svgDir, 'icon-search.svg'))).toBe(true);
    expect(fs.existsSync(path.join(svgDir, 'search.svg'))).toBe(false);
    const content = fs.readFileSync(path.join(distDir, 'svg-map.js'), 'utf8');
    expect(content).toContain('"icon-search"');
  });
});
