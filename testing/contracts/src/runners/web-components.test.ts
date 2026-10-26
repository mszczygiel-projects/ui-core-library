import '@mszczygiel-projects/ui-core-web-components/loader';
import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/text-field';

import { describe } from 'vitest';

import { mountWebComponentButton } from '../harness/button.tsx';
import { mountWebComponentTextField } from '../harness/text-field.tsx';
import { webComponentMount } from '../harness/web-component.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { textFieldContract } from '../specs/text-field.contract.ts';

describe('Loader, web component', () => {
  loaderContract(webComponentMount('ui-loader'));
});

describe('Button, web component', () => {
  buttonContract(mountWebComponentButton);
});

describe('TextField, web component', () => {
  textFieldContract(mountWebComponentTextField);
});
