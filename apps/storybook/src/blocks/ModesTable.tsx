import { manifest } from '../manifest.ts';

const ATTRIBUTES = [
  ['data-theme', 'theme', 'the light theme, or dark when the system prefers it'],
  ['data-surface', 'surface', 'the default surface'],
  ['data-density', 'density', 'the comfortable density'],
  ['data-brand', 'brand', 'the base brand'],
] as const;

/** The context attributes and their values, as the tokens of this build define them. */
export function ModesTable() {
  return (
    <table className="sb-table ui-text-body-small">
      <thead>
        <tr>
          <th scope="col">Attribute</th>
          <th scope="col">Values</th>
          <th scope="col">Without the attribute</th>
        </tr>
      </thead>
      <tbody>
        {ATTRIBUTES.map(([attribute, axis, fallback]) => (
          <tr key={attribute}>
            <th scope="row">
              <code>{attribute}</code>
            </th>
            <td>
              {manifest.modes[axis].length === 0
                ? 'none in this build'
                : manifest.modes[axis].map((mode) => <code key={mode}>{mode} </code>)}
            </td>
            <td>{fallback}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
