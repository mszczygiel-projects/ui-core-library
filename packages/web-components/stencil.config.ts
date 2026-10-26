import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ui-core',
  // The components compile with their own options, apart from the scripts of the package.
  tsconfig: 'tsconfig.lib.json',
  // The other packages of the library stay imports, so an application installs one copy of each.
  rollupConfig: { inputOptions: { external: [/^@mszczygiel-projects\//] } },
  outputTargets: [
    {
      // One module per component, which defines its tag when it loads.
      type: 'dist-custom-elements',
      dir: 'dist/components',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: true,
      generateTypeDeclarations: true,
    },
    // The manifest that the documentation site, agents and editors read.
    { type: 'docs-custom-elements-manifest', file: 'dist/custom-elements.json' },
  ],
};
