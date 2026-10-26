import '@mszczygiel-projects/ui-core-web-components/loader';

import { describe } from 'vitest';

import { webComponentMount } from '../harness/web-component.ts';
import { loaderContract } from '../specs/loader.contract.ts';

describe('Loader, web component', () => {
  loaderContract(webComponentMount('ui-loader'));
});
