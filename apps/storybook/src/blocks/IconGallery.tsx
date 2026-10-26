import * as icons from '@mszczygiel-projects/ui-core-icons';

/** `iconChevronDown` → `chevron-down`, the name of the icon in Figma. */
function figmaName(exportName: string): string {
  return exportName
    .replace(/^icon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** Every icon of the package, with the name it is imported by and its name in Figma. */
export function IconGallery() {
  return (
    <ul className="sb-icons" role="list">
      {Object.entries(icons).map(([exportName, svg]) => (
        <li key={exportName} className="sb-icon-tile ui-text-caption">
          {/* The strings are built from checked SVG files, so they are safe to insert. */}
          <span className="sb-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
          <code>{exportName}</code>
          <span className="sb-muted">icon/{figmaName(exportName)}</span>
        </li>
      ))}
    </ul>
  );
}
