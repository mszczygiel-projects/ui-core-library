/**
 * Follows an attribute that the page writes on a host, such as `aria-label`, which Stencil does
 * not observe because no prop owns it. `onChange` receives the value at once and after each
 * change; the returned function stops following.
 */
export function followAttribute(
  host: HTMLElement,
  name: string,
  onChange: (value: string | null) => void,
): () => void {
  onChange(host.getAttribute(name));
  const observer = new MutationObserver(() => {
    onChange(host.getAttribute(name));
  });
  observer.observe(host, { attributes: true, attributeFilter: [name] });
  return () => {
    observer.disconnect();
  };
}
