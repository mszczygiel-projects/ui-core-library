import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ui-core',
  // The components compile with their own options, apart from the scripts of the package.
  tsconfig: 'tsconfig.lib.json',
  // Stencil marks a rendered host with a class; the host belongs to the page, which owns its classes.
  hydratedFlag: null,
  // The other packages of the library and its dependencies stay imports, so an application
  // installs one copy of each.
  rollupConfig: { inputOptions: { external: [/^@mszczygiel-projects\//, /^@floating-ui\//] } },
  outputTargets: [
    {
      // One module per component, which defines its tag when it loads.
      type: 'dist-custom-elements',
      dir: 'dist/components',
      customElementsExportBehavior: 'auto-define-custom-elements',
      // The runtime is built with the options above. The shared runtime of @stencil/core ignores
      // them, so it would mark every host as hydrated.
      externalRuntime: false,
      generateTypeDeclarations: true,
    },
    // The manifest that the documentation site, agents and editors read.
    { type: 'docs-custom-elements-manifest', file: 'dist/custom-elements.json' },
  ],
};
