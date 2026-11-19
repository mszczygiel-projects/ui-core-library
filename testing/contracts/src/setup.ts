import '@mszczygiel-projects/ui-core-foundations/tokens.css';
import '@mszczygiel-projects/ui-core-react/styles.css';

import { resetUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { afterEach } from 'vitest';
import { commands } from 'vitest/browser';

// Also runs when a contract fails before it can restore application or browser state.
afterEach(async () => {
  resetUiCoreConfig();
  await commands.emulateMedia({ reducedMotion: null, forcedColors: null });
});
