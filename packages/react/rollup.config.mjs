import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import typescript from '@rollup/plugin-typescript';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.join(packageRoot, 'src');
const distRoot = path.join(packageRoot, 'dist');

function isExternal(id) {
  if (id.startsWith('\0')) {
    return false;
  }

  if (id.endsWith('.css')) {
    return true;
  }

  return !id.startsWith('.') && !path.isAbsolute(id);
}

async function copyCssFiles(currentSourceDir, currentDistDir) {
  const entries = await readdir(currentSourceDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(currentSourceDir, entry.name);
      const distPath = path.join(currentDistDir, entry.name);

      if (entry.isDirectory()) {
        await copyCssFiles(sourcePath, distPath);
        return;
      }

      if (!entry.isFile() || !entry.name.endsWith('.css')) {
        return;
      }

      await mkdir(path.dirname(distPath), { recursive: true });
      await copyFile(sourcePath, distPath);
    }),
  );
}

function cleanAndCopyCss() {
  return {
    name: 'clean-and-copy-css',
    async buildStart() {
      await rm(distRoot, { recursive: true, force: true });
    },
    async closeBundle() {
      await copyCssFiles(sourceRoot, distRoot);
    },
  };
}

export default {
  input: path.join(sourceRoot, 'index.ts'),
  external: isExternal,
  plugins: [
    cleanAndCopyCss(),
    typescript({
      tsconfig: path.join(packageRoot, 'tsconfig.rollup.json'),
      compilerOptions: {
        declaration: false,
        declarationMap: false,
        emitDeclarationOnly: false,
        sourceMap: false,
      },
    }),
  ],
  output: {
    dir: distRoot,
    format: 'es',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    assetFileNames: '[name][extname]',
    sourcemap: false,
  },
};