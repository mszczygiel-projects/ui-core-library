import {
  getUiCoreConfig,
  subscribeUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';

/**
 * Follows the configuration while a component is on the page, so that a new language reaches the
 * components already rendered. `onChange` receives the configuration at once, since it may have
 * changed while the component was off the page.
 */
export function followConfig(onChange: (config: UiCoreConfig) => void): () => void {
  onChange(getUiCoreConfig());
  return subscribeUiCoreConfig(() => {
    onChange(getUiCoreConfig());
  });
}
