export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/index.ts',
    'src/styles/**',
    'src/**/*.styles.ts',
    'src/**/*.stories.ts',
    'src/**/*.test.ts',
  ],
  litelement: true,
  plugins: [
    // Private/protected/static members are implementation detail, and events
    // without a description are false positives from dynamic dispatchEvent
    // calls (every real event carries an @fires description per convention).
    // Keep both out of Storybook autodocs tables and dist/llms.txt.
    {
      name: 'strip-internals',
      packageLinkPhase({ customElementsManifest }) {
        for (const module of customElementsManifest.modules ?? []) {
          for (const declaration of module.declarations ?? []) {
            if (declaration.members) {
              declaration.members = declaration.members.filter(
                (member) =>
                  member.privacy !== 'private' &&
                  member.privacy !== 'protected' &&
                  !member.static &&
                  !member.name?.startsWith('_'),
              );
            }
            if (declaration.events) {
              declaration.events = declaration.events.filter((event) => event.description);
            }
          }
        }
      },
    },
    // The analyzer drops unknown JSDoc tags; keep @example so generate-llms.ts
    // can ship usage snippets in dist/llms.txt.
    {
      name: 'capture-example-tag',
      analyzePhase({ ts, node, moduleDoc }) {
        if (!ts.isClassDeclaration(node) || !node.name) return;
        for (const jsDoc of node.jsDoc ?? []) {
          for (const tag of jsDoc.tags ?? []) {
            if (tag.tagName?.text !== 'example') continue;
            const text =
              typeof tag.comment === 'string'
                ? tag.comment
                : (tag.comment ?? []).map((part) => part.text).join('');
            const declaration = moduleDoc.declarations?.find(
              (decl) => decl.name === node.name.text,
            );
            if (declaration && text) declaration.example = text.trim();
          }
        }
      },
    },
  ],
};
