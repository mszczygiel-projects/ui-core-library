import type { ManifestShadow, ManifestToken } from '@mszczygiel-projects/ui-core-foundations';
import type { CSSProperties } from 'react';

import { describeValue, valueIn } from '../tokens.ts';

function Rows({
  tokens,
  className,
  render,
}: {
  readonly tokens: readonly ManifestToken[];
  readonly className: string;
  readonly render: (name: string) => CSSProperties;
}) {
  return (
    <table className="sb-table ui-text-body-small">
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Value</th>
          <th scope="col">Preview</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const value = valueIn(token);
          return (
            <tr key={token.name}>
              <th scope="row">
                <code>{token.name}</code>
              </th>
              <td>{value === undefined ? '' : describeValue(value)}</td>
              <td>
                <span className={className} style={render(token.name)} aria-hidden="true" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Corner radii, each drawn on a square. */
export function RadiusScale({ tokens }: { readonly tokens: readonly ManifestToken[] }) {
  return (
    <Rows
      tokens={tokens}
      className="sb-box"
      render={(name) => ({ borderRadius: `var(${name})` })}
    />
  );
}

/** The composite shadows, each cast by a card. */
export function ShadowScale({ shadows }: { readonly shadows: readonly ManifestShadow[] }) {
  return (
    <table className="sb-table ui-text-body-small">
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Shape and colour</th>
          <th scope="col">Preview</th>
        </tr>
      </thead>
      <tbody>
        {shadows.map((shadow) => (
          <tr key={shadow.name}>
            <th scope="row">
              <code>{shadow.name}</code>
            </th>
            <td>
              <div className="sb-cell">
                <span>{shadow.value}</span>
                <span className="sb-muted">
                  <code>{shadow.shape}</code> <code>{shadow.color}</code>
                </span>
              </div>
            </td>
            <td>
              <span
                className="sb-shadow"
                style={{ boxShadow: `var(${shadow.name})` }}
                aria-hidden="true"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
