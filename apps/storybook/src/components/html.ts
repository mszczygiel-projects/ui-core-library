const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/**
 * The HTML of a web component, which the code panel of a story shows: attributes in the order
 * given, booleans present only when true, and empty or default values left out by the caller.
 */
export function htmlOf(
  tag: string,
  attributes: Readonly<Record<string, string | number | boolean | undefined>>,
  content = '',
): string {
  const written = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== false && value !== '')
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escape(String(value))}"`))
    .join('');
  return `<${tag}${written}>${content}</${tag}>`;
}

/** Text content of a web component, escaped for its HTML. */
export const textOf = escape;
