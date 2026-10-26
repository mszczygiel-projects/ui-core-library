import {
  getUiCoreConfig,
  subscribeUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { useSyncExternalStore } from 'react';

/**
 * The configuration of the library, rendered again when it changes. A server
 * renders with the configuration it set before rendering, and the browser hydrates with the same.
 */
export function useUiCoreConfig(): UiCoreConfig {
  return useSyncExternalStore(subscribeUiCoreConfig, getUiCoreConfig, getUiCoreConfig);
}
