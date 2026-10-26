import manifest from '@mszczygiel-projects/ui-core-web-components/custom-elements.json' with { type: 'json' };
import type { ReactNode } from 'react';
import reactApi from 'virtual:ui-core/react-api';

interface Described {
  readonly name: string;
  readonly description?: string;
}

interface CemMember extends Described {
  readonly kind: string;
  readonly privacy?: string;
  readonly static?: boolean;
  readonly attribute?: string;
  readonly type?: { readonly text: string };
  readonly default?: string;
}

interface CemDeclaration extends Described {
  readonly tagName?: string;
  readonly summary?: string;
  readonly members?: readonly CemMember[];
  readonly events?: readonly (Described & { readonly type?: { readonly text: string } })[];
  readonly slots?: readonly Described[];
  readonly cssParts?: readonly Described[];
  readonly cssProperties?: readonly Described[];
}

const declarations: readonly CemDeclaration[] = (
  manifest as { readonly modules: readonly { readonly declarations?: readonly CemDeclaration[] }[] }
).modules.flatMap((module) => module.declarations ?? []);

/** The declaration of a web component in the Custom Elements Manifest of its package. */
export function webComponentDeclaration(tag: string): CemDeclaration {
  const declaration = declarations.find((candidate) => candidate.tagName === tag);
  if (declaration === undefined) {
    throw new Error(`The manifest of the web components has no ${tag}`);
  }
  return declaration;
}

interface Row {
  readonly key: string;
  readonly cells: readonly ReactNode[];
}

function Table({
  caption,
  head,
  rows,
}: {
  readonly caption: string;
  readonly head: readonly string[];
  readonly rows: readonly Row[];
}) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <table className="sb-table ui-text-body-small">
      <caption className="ui-text-heading-h5">{caption}</caption>
      <thead>
        <tr>
          {head.map((cell) => (
            <th scope="col" key={cell}>
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key, cells }) => (
          <tr key={key}>
            {cells.map((cell, column) =>
              column === 0 ? (
                <th scope="row" key={head[column]}>
                  {cell}
                </th>
              ) : (
                <td key={head[column]}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const code = (text: string | undefined) => (text === undefined ? '' : <code>{text}</code>);

/** The API of a web component, from the Custom Elements Manifest of its package. */
export function WebComponentApi({ tag }: { readonly tag: string }) {
  const declaration = webComponentDeclaration(tag);
  const properties = (declaration.members ?? []).filter(
    (member) =>
      member.kind === 'field' &&
      member.static !== true &&
      member.privacy !== 'private' &&
      member.privacy !== 'protected',
  );
  return (
    <>
      <Table
        caption="Properties and attributes"
        head={['Property', 'Attribute', 'Type', 'Default', 'Description']}
        rows={properties.map((member) => ({
          key: member.name,
          cells: [
            code(member.name),
            code(member.attribute),
            code(member.type?.text),
            code(member.default),
            member.description ?? '',
          ],
        }))}
      />
      <Table
        caption="Events"
        head={['Event', 'Detail', 'Description']}
        rows={(declaration.events ?? []).map((event) => ({
          key: event.name,
          cells: [code(event.name), code(event.type?.text), event.description ?? ''],
        }))}
      />
      <Table
        caption="Slots"
        head={['Slot', 'Description']}
        rows={(declaration.slots ?? []).map((slot) => ({
          key: slot.name,
          cells: [code(slot.name === '' ? '(default)' : slot.name), slot.description ?? ''],
        }))}
      />
      <Table
        caption="Parts"
        head={['Part', 'Description']}
        rows={(declaration.cssParts ?? []).map((part) => ({
          key: part.name,
          cells: [code(`::part(${part.name})`), part.description ?? ''],
        }))}
      />
      <Table
        caption="Tokens"
        head={['Custom property', 'Description']}
        rows={(declaration.cssProperties ?? []).map((property) => ({
          key: property.name,
          cells: [code(property.name), property.description ?? ''],
        }))}
      />
    </>
  );
}

/** The props of a React component, from the published types of its package. */
export function ReactApi({ component }: { readonly component: string }) {
  const api = reactApi.find((candidate) => candidate.name === component);
  if (api === undefined) {
    throw new Error(`The React package exports no ${component}`);
  }
  return (
    <Table
      caption="Props"
      head={['Prop', 'Type', 'Default', 'Description']}
      rows={api.props.map((prop) => ({
        key: prop.name,
        cells: [
          code(prop.required ? `${prop.name}*` : prop.name),
          code(prop.type),
          code(prop.defaultValue),
          prop.description,
        ],
      }))}
    />
  );
}
