/**
 * The public API of the package: the declarations of the subpaths it exports, and of the files
 * they import or re-export, emitted from the sources without comments, so that a change of a name
 * or a signature shows as a change of text.
 */
import { readFileSync } from 'node:fs';
import { join, posix, relative } from 'node:path';

import ts from 'typescript';

interface Manifest {
  readonly exports: Readonly<Record<string, string | { readonly types?: string }>>;
}

const host: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
};

/** The modules that declarations import or re-export, types imported inline included. */
function moduleSpecifiers(text: string): string[] {
  const specifiers: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      specifiers.push(node.argument.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile('declarations.d.ts', text, ts.ScriptTarget.Latest));
  return specifiers;
}

/**
 * The declarations of `entries` and of every declaration file they reach through relative imports
 * and re-exports, by file name. A subpath that re-exports a helper from a file of its own shows
 * that file's declarations in its API, so a change there shows too.
 */
export function reachableDeclarations(
  entries: readonly string[],
  emitted: ReadonlyMap<string, string>,
): Map<string, string> {
  const declarations = new Map<string, string>();
  const queue = [...entries];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (declarations.has(file)) {
      continue;
    }
    const text = emitted.get(file);
    if (text === undefined) {
      throw new Error(`${file} is part of the API, but the sources emit no such declarations`);
    }
    declarations.set(file, text);
    for (const specifier of moduleSpecifiers(text)) {
      if (specifier.startsWith('.')) {
        const target = posix.join(posix.dirname(file), specifier);
        queue.push(`${target.replace(/\.[jt]s$/, '')}.d.ts`);
      }
    }
  }
  return declarations;
}

/**
 * The declarations of every subpath of the package at `root`, and of the files they reach, by file
 * name, such as `date.d.ts`.
 */
export function publicDeclarations(root: string): Map<string, string> {
  const configPath = join(root, 'tsconfig.lib.json');
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.formatDiagnostic(diagnostic, host));
      },
    },
  );
  if (config === undefined) {
    throw new Error(`${configPath} cannot be read`);
  }
  const outDir = config.options.outDir ?? join(root, 'dist');
  const program = ts.createProgram(config.fileNames, {
    ...config.options,
    declaration: true,
    emitDeclarationOnly: true,
    removeComments: true,
    declarationMap: false,
    composite: false,
    incremental: false,
    tsBuildInfoFile: undefined,
  });
  const emitted = new Map<string, string>();
  const { diagnostics } = program.emit(undefined, (fileName, text) => {
    emitted.set(relative(outDir, fileName), text);
  });
  const problems = [...ts.getPreEmitDiagnostics(program), ...diagnostics];
  if (problems.length > 0) {
    throw new Error(ts.formatDiagnostics(problems, host));
  }

  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Manifest;
  const entries: string[] = [];
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (typeof target === 'string') {
      continue;
    }
    const file = target.types?.replace(/^\.\/dist\//, '');
    if (file === undefined || !emitted.has(file)) {
      throw new Error(`${subpath} exports no declarations that the sources emit`);
    }
    entries.push(file);
  }
  return reachableDeclarations(entries, emitted);
}

export interface ApiChange {
  readonly file: string;
  /** The lines of the snapshot that the current declarations no longer have in that place. */
  readonly removed: readonly string[];
  /** The lines of the current declarations that the snapshot does not have in that place. */
  readonly added: readonly string[];
}

function lines(text: string | undefined): string[] {
  return text === undefined ? [] : text.split('\n').filter((line) => line.trim() !== '');
}

/**
 * The lines outside the longest sequence that `before` and `after` share in order, so that a line
 * that moved shows as removed in one place and added in another.
 */
function lineChanges(
  before: readonly string[],
  after: readonly string[],
): Pick<ApiChange, 'removed' | 'added'> {
  const width = after.length + 1;
  // shared[i * width + j]: how many lines before[i..] and after[j..] share in order.
  const shared = new Array<number>((before.length + 1) * width).fill(0);
  const sharedFrom = (i: number, j: number): number => shared[i * width + j] ?? 0;
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      shared[i * width + j] =
        before[i] === after[j]
          ? sharedFrom(i + 1, j + 1) + 1
          : Math.max(sharedFrom(i + 1, j), sharedFrom(i, j + 1));
    }
  }
  const removed: string[] = [];
  const added: string[] = [];
  let i = 0;
  let j = 0;
  for (;;) {
    const old = before[i];
    const current = after[j];
    if (old === undefined && current === undefined) {
      return { removed, added };
    }
    if (old !== undefined && old === current) {
      i++;
      j++;
    } else if (
      current !== undefined &&
      (old === undefined || sharedFrom(i, j + 1) >= sharedFrom(i + 1, j))
    ) {
      added.push(current);
      j++;
    } else if (old !== undefined) {
      removed.push(old);
      i++;
    }
  }
}

/** The files whose declarations differ between the snapshot and the current sources. */
export function diffDeclarations(
  committed: ReadonlyMap<string, string>,
  current: ReadonlyMap<string, string>,
): ApiChange[] {
  const files = [...new Set([...committed.keys(), ...current.keys()])].sort();
  const changes: ApiChange[] = [];
  for (const file of files) {
    const { removed, added } = lineChanges(lines(committed.get(file)), lines(current.get(file)));
    if (removed.length > 0 || added.length > 0) {
      changes.push({ file, removed, added });
    }
  }
  return changes;
}
