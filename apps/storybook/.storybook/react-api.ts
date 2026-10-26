import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import docgen from 'react-docgen-typescript';
import ts from 'typescript';

/** A prop of a React component, as its API table shows it. */
export interface ReactProp {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue?: string;
  readonly description: string;
}

/** The API of a React component, read from the types that its package publishes. */
export interface ReactComponentApi {
  readonly name: string;
  readonly description: string;
  readonly props: readonly ReactProp[];
}

/** The declaration file of the React package, as its `exports` name it for TypeScript. */
function typesEntry(): string {
  const manifestPath = fileURLToPath(
    import.meta.resolve('@mszczygiel-projects/ui-core-react/package.json'),
  );
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const types =
    typeof manifest === 'object' && manifest !== null && 'exports' in manifest
      ? (manifest.exports as Record<string, { types?: string } | string>)['.']
      : undefined;
  if (typeof types !== 'object' || types.types === undefined) {
    throw new Error('The React package names no types for its root entry');
  }
  return join(dirname(manifestPath), types.types);
}

function typeText(type: docgen.PropItemType): string {
  if (type.name === 'enum' && Array.isArray(type.value)) {
    return (type.value as { value: string }[]).map((item) => item.value).join(' | ');
  }
  return type.raw ?? type.name;
}

/**
 * The props of every component of the React package, from its published declarations, as an
 * application sees them. Props inherited from React's own types are left out.
 */
export function readReactApi(): ReactComponentApi[] {
  const parser = docgen.withCompilerOptions(
    {
      strict: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      skipLibCheck: true,
    },
    {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      savePropValueAsString: true,
      propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
    },
  );
  return parser.parse(typesEntry()).map((component) => ({
    name: component.displayName,
    description: component.description,
    props: Object.values(component.props).map((prop) => ({
      name: prop.name,
      type: typeText(prop.type),
      required: prop.required,
      ...(prop.defaultValue === null || prop.defaultValue === undefined
        ? {}
        : { defaultValue: String((prop.defaultValue as { value: unknown }).value) }),
      description: prop.description,
    })),
  }));
}
