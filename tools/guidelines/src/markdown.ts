/** A Markdown table, the form Figma recommends for catalogs, tokens and properties. */
export function table(head: readonly string[], rows: readonly (readonly string[])[]): string {
  const escape = (cell: string) => cell.replaceAll('|', '\\|').replaceAll('\n', ' ');
  return [
    `| ${head.map(escape).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

/** Code, as in Markdown. */
export const code = (text: string): string => `\`${text}\``;

/** A file of guidelines from its blocks, separated by blank lines and ending with one newline. */
export function file(...blocks: readonly (string | undefined)[]): string {
  return `${blocks.filter((block) => block !== undefined && block !== '').join('\n\n')}\n`;
}
