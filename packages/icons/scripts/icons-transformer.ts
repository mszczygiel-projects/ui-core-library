import { optimize, type Config } from 'svgo';
import { transform } from '@svgr/core';
import fs from 'node:fs';
import path from 'node:path';

// ─── Naming ───────────────────────────────────────────────────────────────────

export function toPascalCase(name: string): string {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// ─── SVGO ─────────────────────────────────────────────────────────────────────

export const svgoConfig: Config = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeUselessStrokeAndFill: false,
        },
      },
    },
    {
      name: 'removeAttrs',
      params: {
        attrs: ['svg:width', 'svg:height'],
      },
    },
    {
      name: 'convertHardcodedColors',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fn: (): any => ({
        element: {
          enter: (node: { attributes: Record<string, string> }) => {
            const colorProps = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
            for (const prop of colorProps) {
              const val = node.attributes[prop];
              if (val !== undefined && val !== 'none' && val !== 'currentColor') {
                node.attributes[prop] = 'currentColor';
              }
            }
          },
        },
      }),
    },
  ],
};

export function optimizeSvg(raw: string, filePath?: string): string {
  const { data } = optimize(raw, { ...svgoConfig, path: filePath });
  return data;
}

// ─── SVGR ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const svgrTemplate = (variables: any, { tpl }: any) => tpl`
import * as React from 'react';
export function ${variables.componentName}(${variables.props}) {
  return ${variables.jsx};
}
`;

export async function buildReactComponent(svg: string, componentName: string): Promise<string> {
  return transform(
    svg,
    {
      plugins: ['@svgr/plugin-jsx'],
      jsxRuntime: 'classic',
      template: svgrTemplate,
    },
    { componentName },
  );
}

// ─── Filesystem ───────────────────────────────────────────────────────────────

export function ensureIconPrefixInSvgFilenames(dir: string): void {
  const svgFiles = fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort();

  for (const file of svgFiles) {
    if (file.startsWith('icon-')) {
      continue;
    }

    const targetFile = `icon-${file}`;
    const sourcePath = path.join(dir, file);
    const targetPath = path.join(dir, targetFile);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Cannot rename ${file} to ${targetFile}: target file already exists.`);
    }

    fs.renameSync(sourcePath, targetPath);
  }
}
