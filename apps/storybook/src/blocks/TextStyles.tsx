import { manifest } from '../manifest.ts';
import { describeValue, findToken, modeLabel } from '../tokens.ts';

function values(name: string | undefined): string {
  const token = name === undefined ? undefined : findToken(manifest, name);
  if (token === undefined) {
    return '';
  }
  return token.values
    .map((value) => {
      const size = value.context.size;
      return size === undefined
        ? describeValue(value)
        : `${modeLabel(size)} ${describeValue(value)}`;
    })
    .join(', ');
}

/** Every text style: a sample set in its class, and the roles behind it. */
export function TextStyles() {
  return (
    <table className="sb-table ui-text-body-small">
      <thead>
        <tr>
          <th scope="col">Style</th>
          <th scope="col">Class and roles</th>
        </tr>
      </thead>
      <tbody>
        {manifest.textStyles.map((style) => (
          <tr key={style.className}>
            <td>
              <p className={`${style.className} sb-sample`}>
                The quick brown fox <strong>jumps</strong> over the lazy dog
              </p>
            </td>
            <td>
              <div className="sb-cell">
                <code>.{style.className}</code>
                <span>Size: {values(style.properties['font-size'])}</span>
                <span>Line height: {values(style.properties['line-height'])}</span>
                <span>Weight: {values(style.properties['font-weight'])}</span>
                {style.strongWeight === undefined ? null : (
                  <span>Strong: {values(style.strongWeight)}</span>
                )}
                <span>Letter spacing: {values(style.properties['letter-spacing'])}</span>
                {style.properties['text-transform'] === undefined ? null : (
                  <span>Transform: {values(style.properties['text-transform'])}</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
