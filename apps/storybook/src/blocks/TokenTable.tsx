import type { ManifestToken } from '@mszczygiel-projects/ui-core-foundations';
import type { ReactNode } from 'react';

import { type Context, contextLabel, describeValue, valueIn } from '../tokens.ts';
import { ContextFrame } from './ContextFrame.tsx';

/**
 * A table of tokens: the custom property, its value in each context the table shows, rendered by
 * `preview` when it can be seen, and what it is for.
 */
export function TokenTable({
  tokens,
  contexts = [{}],
  preview,
  caption,
}: {
  readonly tokens: readonly ManifestToken[];
  readonly contexts?: readonly Context[];
  readonly preview?: (name: string) => ReactNode;
  readonly caption?: string;
}) {
  return (
    <table className="sb-table ui-text-body-small">
      {caption === undefined ? null : <caption className="ui-text-heading-h5">{caption}</caption>}
      <thead>
        <tr>
          <th scope="col">Token</th>
          {contexts.map((context) => (
            <th scope="col" key={contextLabel(context)}>
              {contextLabel(context)}
            </th>
          ))}
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.name}>
            <th scope="row">
              <code>{token.name}</code>
            </th>
            {contexts.map((context) => {
              const value = valueIn(token, context);
              return (
                <td key={contextLabel(context)}>
                  <div className="sb-cell">
                    {preview === undefined ? null : (
                      <ContextFrame context={context}>{preview(token.name)}</ContextFrame>
                    )}
                    <span>{value === undefined ? '' : describeValue(value)}</span>
                    {value?.alias === undefined ? null : (
                      <span className="sb-muted">
                        <code>{value.alias}</code>
                      </span>
                    )}
                  </div>
                </td>
              );
            })}
            <td>{token.description ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A colour, painted by its custom property. */
export function Swatch({ name }: { readonly name: string }) {
  return (
    <span className="sb-swatch" aria-hidden="true" style={{ backgroundColor: `var(${name})` }} />
  );
}
