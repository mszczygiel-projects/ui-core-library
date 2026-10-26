import '@mszczygiel-projects/ui-core-web-components/loader';
import '@mszczygiel-projects/ui-core-web-components/button';

import { describe } from 'vitest';

import { mountWebComponentButton } from '../harness/button.tsx';
import { webComponentMount } from '../harness/web-component.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';

describe('Loader, web component', () => {
  loaderContract(webComponentMount('ui-loader'));
});

describe('Button, web component', () => {
  buttonContract(mountWebComponentButton);
});
