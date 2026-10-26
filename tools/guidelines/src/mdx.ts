/**
 * The prose of a documentation page by section. The pages are MDX: imports, blocks of the site
 * and code samples are for Storybook, so only the Markdown between them is kept.
 */
export function sectionsOf(mdx: string): Map<string, string> {
  const sections = new Map<string, string>();
  let heading: string | undefined;
  let lines: string[] = [];
  let inBlock = false;
  let inFence = false;
  const close = () => {
    if (heading !== undefined) {
      sections.set(
        heading,
        lines
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim(),
      );
    }
  };
  for (const line of mdx.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    // A block of the site, such as <Source …/> or <FrameworkTabs …/>, may span several lines.
    if (inBlock) {
      inBlock = !/\/?>\s*$/.test(line);
      continue;
    }
    if (/^\s*</.test(line)) {
      inBlock = !/\/?>\s*$/.test(line);
      continue;
    }
    if (line.startsWith('import ')) {
      continue;
    }
    const match = /^## (.+)$/.exec(line);
    if (match?.[1] !== undefined) {
      close();
      heading = match[1].trim();
      lines = [];
      continue;
    }
    if (heading !== undefined) {
      lines.push(line);
    }
  }
  close();
  return sections;
}
