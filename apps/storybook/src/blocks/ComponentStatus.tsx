import { catalog, categories, pageOf, specOf } from '../components/catalog.ts';

const FIGMA_FILE = 'https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/';

function figmaLink(node: string): string {
  return `${FIGMA_FILE}?node-id=${node.replace(':', '-')}`;
}

function Status({ status }: { readonly status: string }) {
  return <span className={`sb-status sb-status--${status} ui-text-caption`}>{status}</span>;
}

/** The status of every component, from the specifications in shared, by category. */
export function ComponentStatus() {
  return (
    <>
      {categories.map((category) => (
        <table className="sb-table ui-text-body-small" key={category}>
          <caption className="ui-text-heading-h5">{category}</caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Tag</th>
              <th scope="col">Status</th>
              <th scope="col">Figma</th>
            </tr>
          </thead>
          <tbody>
            {catalog
              .filter((component) => component.category === category)
              .map((component) => (
                <tr key={component.name}>
                  <th scope="row">
                    {component.status === 'planned' ? (
                      component.name
                    ) : (
                      <a href={`?path=/docs/${pageOf(component)}`}>{component.name}</a>
                    )}
                  </th>
                  <td>
                    <code>{component.tag}</code>
                  </td>
                  <td>
                    <Status status={component.status} />
                  </td>
                  <td>
                    {component.figma === null ? (
                      ''
                    ) : (
                      <a href={figmaLink(component.figma)} target="_blank" rel="noreferrer">
                        {component.figma}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      ))}
    </>
  );
}

/**
 * The opening of a component page: the summary of its specification, which the JSDoc, the page
 * and the Figma component share, and the links. The status shows only on Components/Status.
 */
export function ComponentOverview({ name }: { readonly name: string }) {
  const component = specOf(name);
  const summary = component.summary;
  return (
    <div className="sb-overview">
      <p className="ui-text-body-large">{summary}</p>
      <dl className="sb-facts ui-text-body-small">
        <dt>Web component</dt>
        <dd>
          <code>{`<${component.tag}>`}</code>
        </dd>
        <dt>React</dt>
        <dd>
          <code>{`<${component.name}>`}</code>
        </dd>
        {component.figma === null ? null : (
          <>
            <dt>Figma</dt>
            <dd>
              <a href={figmaLink(component.figma)} target="_blank" rel="noreferrer">
                [Core] UI Library, {component.name}
              </a>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
