import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  toPascalCase,
  optimizeSvg,
  buildReactComponent,
  ensureIconPrefixInSvgFilenames,
} from './icons-transformer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SVG_DIR = path.resolve(__dirname, '../src/svg');
const DIST_DIR = path.resolve(__dirname, '../dist');
const REACT_DIST_DIR = path.join(DIST_DIR, 'react');

async function buildIcons() {
  ensureIconPrefixInSvgFilenames(SVG_DIR);

  const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg')).sort();

  const entries: { iconName: string; componentName: string; svg: string }[] = [];

  for (const file of files) {
    const iconName = file.replace(/\.svg$/, '');
    const componentName = toPascalCase(iconName);
    const raw = fs.readFileSync(path.join(SVG_DIR, file), 'utf8');
    const svg = optimizeSvg(raw, path.join(SVG_DIR, file));
    entries.push({ iconName, componentName, svg });
  }

  // Ensure deterministic output and remove stale generated files from previous builds.
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(REACT_DIST_DIR, { recursive: true });

  // dist/icon-names.d.ts
  const iconNamesUnion = entries.map(e => `'${e.iconName}'`).join(' | ');
  fs.writeFileSync(
    path.join(DIST_DIR, 'icon-names.d.ts'),
    `export type IconName = ${iconNamesUnion};\n`,
  );

  // dist/svg-map.js
  const mapEntries = entries.map(e => `  ${JSON.stringify(e.iconName)}: ${JSON.stringify(e.svg)},`).join('\n');
  fs.writeFileSync(
    path.join(DIST_DIR, 'svg-map.js'),
    `export const svgMap = {\n${mapEntries}\n};\n`,
  );

  // dist/svg-map.d.ts
  fs.writeFileSync(
    path.join(DIST_DIR, 'svg-map.d.ts'),
    `import type { IconName } from './icon-names.js';\nexport declare const svgMap: Record<IconName, string>;\n`,
  );

  // React components
  const barrelExports: string[] = [];

  for (const { componentName, svg } of entries) {
    const jsx = await buildReactComponent(svg, componentName);

    fs.writeFileSync(path.join(REACT_DIST_DIR, `${componentName}.jsx`), jsx);

    fs.writeFileSync(
      path.join(REACT_DIST_DIR, `${componentName}.d.ts`),
      `import * as React from 'react';\nexport declare function ${componentName}(props: React.SVGProps<SVGSVGElement>): React.JSX.Element;\n`,
    );

    barrelExports.push(`export { ${componentName} } from './${componentName}.jsx';`);
  }

  // dist/react/index.js
  fs.writeFileSync(path.join(REACT_DIST_DIR, 'index.js'), barrelExports.join('\n') + '\n');

  // dist/react/index.d.ts
  const dtsExports = entries
    .map(e => `export { ${e.componentName} } from './${e.componentName}.js';`)
    .join('\n');
  fs.writeFileSync(path.join(REACT_DIST_DIR, 'index.d.ts'), dtsExports + '\n');

  console.log(`✓ Built ${entries.length} icons`);
}

buildIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
