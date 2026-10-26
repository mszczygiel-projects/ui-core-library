import { contextsOf } from '../foundations/specimens.ts';
import { manifest } from '../manifest.ts';
import { groupBy } from '../tokens.ts';
import { TokenTable } from './TokenTable.tsx';

/**
 * The tokens of a component, from `tokens.json`: its styling API. Tokens that change
 * with the density show both densities, and colours both themes.
 */
export function ComponentTokens({ component }: { readonly component: string }) {
  const tokens = manifest.tokens.filter(
    (token) =>
      token.collection === 'Components' &&
      (token.name.startsWith(`--${component}-`) || token.name.startsWith(`--color-${component}-`)),
  );
  const groups = groupBy(tokens, (token) =>
    token.axes.includes('density') ? 'density' : token.axes.includes('theme') ? 'theme' : 'fixed',
  );
  return (
    <>
      {[...groups].map(([axis, members]) => (
        <TokenTable
          key={axis}
          tokens={members}
          contexts={axis === 'fixed' ? [{}] : contextsOf(axis === 'density' ? 'density' : 'theme')}
        />
      ))}
    </>
  );
}
