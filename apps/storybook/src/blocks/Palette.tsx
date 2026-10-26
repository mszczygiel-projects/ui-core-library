import type { ManifestToken } from '@mszczygiel-projects/ui-core-foundations';

import { describeValue, valueIn } from '../tokens.ts';
import { Swatch } from './TokenTable.tsx';

/** A ramp of colours, one step per token, such as the greys from 50 to 1000. */
export function Palette({
  title,
  tokens,
}: {
  readonly title: string;
  readonly tokens: readonly ManifestToken[];
}) {
  return (
    <section className="sb-section">
      <h3 className="ui-text-heading-h5 sb-sample">{title}</h3>
      <ul className="sb-ramp sb-sample" role="list">
        {tokens.map((token) => {
          const value = valueIn(token);
          return (
            <li key={token.name} className="sb-cell ui-text-caption">
              <Swatch name={token.name} />
              <code>{token.name}</code>
              <span className="sb-muted">{value === undefined ? '' : describeValue(value)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
