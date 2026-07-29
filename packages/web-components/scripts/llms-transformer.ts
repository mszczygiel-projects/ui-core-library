export interface CemType {
  text?: string;
}

export interface CemMember {
  kind: string;
  name: string;
  description?: string;
  default?: string;
  attribute?: string;
  type?: CemType;
}

export interface CemEvent {
  name: string;
  description?: string;
  type?: CemType;
}

export interface CemSlot {
  name?: string;
  description?: string;
}

export interface CemCssProperty {
  name: string;
  description?: string;
}

export interface CemDeclaration {
  kind?: string;
  name: string;
  customElement?: boolean;
  tagName?: string;
  description?: string;
  example?: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssProperties?: CemCssProperty[];
}

export interface CemManifest {
  modules?: Array<{ declarations?: CemDeclaration[] }>;
}

/** All custom-element declarations in the manifest, sorted by tag name. */
export function extractComponents(manifest: CemManifest): CemDeclaration[] {
  const declarations = (manifest.modules ?? [])
    .flatMap((module) => module.declarations ?? [])
    .filter((declaration) => declaration.customElement && declaration.tagName);
  return declarations.sort((a, b) => (a.tagName ?? '').localeCompare(b.tagName ?? ''));
}

function tableCell(text: string | undefined): string {
  return (text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

function code(text: string | undefined): string {
  // Multi-line union types keep their leading `|` from source formatting.
  const cell = tableCell(text).replace(/^\\?\|\s*/, '');
  return cell ? `\`${cell}\`` : '—';
}

export function renderComponentSection(declaration: CemDeclaration): string {
  const lines: string[] = [`## ${declaration.name} (\`<${declaration.tagName}>\`)`, ''];

  if (declaration.description) lines.push(declaration.description, '');

  if (declaration.example) {
    const example = declaration.example.startsWith('```')
      ? declaration.example
      : `\`\`\`html\n${declaration.example}\n\`\`\``;
    lines.push('### Usage', '', example, '');
  }

  const fields = (declaration.members ?? []).filter((member) => member.kind === 'field');
  if (fields.length > 0) {
    lines.push(
      '### Properties / Attributes',
      '',
      '| Property | Attribute | Type | Default | Description |',
      '| -------- | --------- | ---- | ------- | ----------- |',
    );
    for (const field of fields) {
      lines.push(
        `| \`${field.name}\` | ${field.attribute ? `\`${field.attribute}\`` : '—'} | ${code(
          field.type?.text,
        )} | ${code(field.default)} | ${tableCell(field.description)} |`,
      );
    }
    lines.push('');
  }

  if (declaration.slots?.length) {
    lines.push('### Slots', '', '| Slot | Description |', '| ---- | ----------- |');
    for (const slot of declaration.slots) {
      lines.push(
        `| ${slot.name ? `\`${slot.name}\`` : '_(default)_'} | ${tableCell(slot.description)} |`,
      );
    }
    lines.push('');
  }

  if (declaration.events?.length) {
    lines.push(
      '### Events',
      '',
      '| Event | Type | Description |',
      '| ----- | ---- | ----------- |',
    );
    for (const event of declaration.events) {
      lines.push(
        `| \`${event.name}\` | ${code(event.type?.text)} | ${tableCell(event.description)} |`,
      );
    }
    lines.push('');
  }

  if (declaration.cssProperties?.length) {
    lines.push(
      '### CSS Custom Properties',
      '',
      '| Property | Description |',
      '| -------- | ----------- |',
    );
    for (const cssProperty of declaration.cssProperties) {
      lines.push(`| \`${cssProperty.name}\` | ${tableCell(cssProperty.description)} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function renderLlmsTxt(
  packageName: string,
  summary: string,
  intro: string,
  declarations: CemDeclaration[],
): string {
  const header = [`# ${packageName}`, '', `> ${summary}`, '', intro, ''];
  const sections = declarations.map(renderComponentSection);
  return [...header, ...sections].join('\n').replace(/\n{3,}/g, '\n\n');
}
