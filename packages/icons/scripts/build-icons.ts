import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  toPascalCase,
  optimizeSvg,
  buildReactComponent,
  ensureIconPrefixInSvgFilenames,
} from './icons-transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SVG_DIR = path.resolve(__dirname, '../src/svg');
export const DEFAULT_DIST_DIR = path.resolve(__dirname, '../dist');

export interface BuildIconsOptions {
  inputDir: string;
  outputDir: string;
}

export async function buildIcons(
  options: BuildIconsOptions = {
    inputDir: DEFAULT_SVG_DIR,
    outputDir: DEFAULT_DIST_DIR,
  },
): Promise<void> {
  const { inputDir, outputDir } = options;
  const reactOutputDir = path.join(outputDir, 'react');

  ensureIconPrefixInSvgFilenames(inputDir);

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.svg'))
    .sort();

  const entries: { iconName: string; componentName: string; svg: string }[] = [];

  for (const file of files) {
    const iconName = file.replace(/\.svg$/, '');
    const componentName = toPascalCase(iconName);
    const raw = fs.readFileSync(path.join(inputDir, file), 'utf8');
    const svg = optimizeSvg(raw, path.join(inputDir, file));
    entries.push({ iconName, componentName, svg });
  }

  // Ensure deterministic output and remove stale generated files from previous builds.
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(reactOutputDir, { recursive: true });

  const iconNamesUnion = entries.map((e) => `'${e.iconName}'`).join(' | ');
  fs.writeFileSync(
    path.join(outputDir, 'icon-names.d.ts'),
    `export type IconName = ${iconNamesUnion};\n`,
  );

  const mapEntries = entries
    .map((e) => `  ${JSON.stringify(e.iconName)}: ${JSON.stringify(e.svg)},`)
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'svg-map.js'),
    `export const svgMap = {\n${mapEntries}\n};\n`,
  );

  fs.writeFileSync(
    path.join(outputDir, 'svg-map.d.ts'),
    `import type { IconName } from './icon-names.js';\nexport declare const svgMap: Record<IconName, string>;\n`,
  );

  const barrelExports: string[] = [];

  for (const { componentName, svg } of entries) {
    const jsx = await buildReactComponent(svg, componentName);

    fs.writeFileSync(path.join(reactOutputDir, `${componentName}.jsx`), jsx);

    fs.writeFileSync(
      path.join(reactOutputDir, `${componentName}.d.ts`),
      `import * as React from 'react';\nexport declare function ${componentName}(props: React.SVGProps<SVGSVGElement>): React.JSX.Element;\n`,
    );

    barrelExports.push(`export { ${componentName} } from './${componentName}.jsx';`);
  }

  fs.writeFileSync(path.join(reactOutputDir, 'index.js'), barrelExports.join('\n') + '\n');

  const dtsExports = entries
    .map((e) => `export { ${e.componentName} } from './${e.componentName}.js';`)
    .join('\n');
  fs.writeFileSync(path.join(reactOutputDir, 'index.d.ts'), dtsExports + '\n');

  console.log(`✓ Built ${entries.length} icons in ${outputDir}`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  buildIcons().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
