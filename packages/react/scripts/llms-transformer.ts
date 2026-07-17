import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { withCompilerOptions } from 'react-docgen-typescript';

export interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  required: boolean;
  description: string;
}

export interface ComponentEntry {
  displayName: string;
  description: string;
  example?: string;
  props: PropRow[];
}

/** Component source files: src/<Component>/<Component>.tsx, skipping stories and tests. */
export function listComponentFiles(srcDir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(srcDir, entry.name, `${entry.name}.tsx`);
    if (fs.existsSync(candidate)) files.push(candidate);
  }
  return files.sort();
}

export function loadCompilerOptions(tsconfigPath: string): ts.CompilerOptions {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(`Cannot read ${tsconfigPath}: ${configFile.error.messageText}`);
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  );
  return parsed.options;
}

interface InterfaceDocs {
  description: string;
  example?: string;
}

/**
 * The convention places the component description and @example on the exported
 * Props interface, which react-docgen-typescript does not surface as the
 * component description — read them straight from the TypeScript AST.
 */
function extractInterfaceDocs(
  filePaths: string[],
  compilerOptions: ts.CompilerOptions,
): Map<string, InterfaceDocs> {
  const program = ts.createProgram(filePaths, compilerOptions);
  const checker = program.getTypeChecker();
  const docs = new Map<string, InterfaceDocs>();

  for (const filePath of filePaths) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) continue;

    sourceFile.forEachChild((node) => {
      if (!ts.isInterfaceDeclaration(node)) return;
      const symbol = checker.getSymbolAtLocation(node.name);
      if (!symbol) return;

      const description = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
      const exampleTag = symbol.getJsDocTags(checker).find((tag) => tag.name === 'example');
      const example = exampleTag?.text
        ? ts.displayPartsToString(exampleTag.text).trim()
        : undefined;

      if (description || example) docs.set(node.name.text, { description, example });
    });
  }

  return docs;
}

interface DocgenPropType {
  name: string;
  value?: Array<{ value: string }>;
}

function formatPropType(type: DocgenPropType): string {
  if (type.name === 'enum' && Array.isArray(type.value)) {
    return type.value.map((entry) => entry.value).join(' | ');
  }
  return type.name;
}

export function parseComponents(
  filePaths: string[],
  compilerOptions: ts.CompilerOptions,
): ComponentEntry[] {
  const parser = withCompilerOptions(compilerOptions, {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    // Keep only props declared in this package — drop inherited DOM props
    // (e.g. TextField extends InputHTMLAttributes).
    propFilter: (prop) => !prop.parent || !prop.parent.fileName.includes('node_modules'),
  });

  const interfaceDocs = extractInterfaceDocs(filePaths, compilerOptions);
  const componentDocs = parser.parse(filePaths);

  return componentDocs
    .map((doc) => {
      const docs = interfaceDocs.get(`${doc.displayName}Props`);
      return {
        displayName: doc.displayName,
        description: docs?.description || doc.description || '',
        example: docs?.example,
        props: Object.values(doc.props).map((prop) => ({
          name: prop.name,
          type: formatPropType(prop.type),
          defaultValue:
            prop.defaultValue?.value !== undefined ? String(prop.defaultValue.value) : undefined,
          required: prop.required,
          description: prop.description ?? '',
        })),
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function tableCell(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

function renderComponentSection(entry: ComponentEntry): string {
  const lines: string[] = [`## ${entry.displayName}`, ''];

  if (entry.description) lines.push(entry.description, '');

  if (entry.example) {
    const example = entry.example.startsWith('```')
      ? entry.example
      : `\`\`\`tsx\n${entry.example}\n\`\`\``;
    lines.push('### Usage', '', example, '');
  }

  if (entry.props.length > 0) {
    lines.push(
      '### Props',
      '',
      '| Prop | Type | Default | Required | Description |',
      '| ---- | ---- | ------- | -------- | ----------- |',
    );
    for (const prop of entry.props) {
      lines.push(
        `| \`${prop.name}\` | \`${tableCell(prop.type)}\` | ${
          prop.defaultValue !== undefined ? `\`${tableCell(prop.defaultValue)}\`` : '—'
        } | ${prop.required ? 'Yes' : 'No'} | ${tableCell(prop.description)} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function renderLlmsTxt(
  packageName: string,
  summary: string,
  intro: string,
  entries: ComponentEntry[],
): string {
  const header = [`# ${packageName}`, '', `> ${summary}`, '', intro, ''];
  const sections = entries.map(renderComponentSection);
  return [...header, ...sections].join('\n').replace(/\n{3,}/g, '\n\n');
}
