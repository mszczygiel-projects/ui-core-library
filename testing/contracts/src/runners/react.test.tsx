import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactButton } from '../harness/button.tsx';
import { reactMount } from '../harness/react.tsx';
import { mountReactTextField } from '../harness/text-field.tsx';
import { buttonContract } from '../specs/button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { textFieldContract } from '../specs/text-field.contract.ts';

describe('Loader, React', () => {
  loaderContract(reactMount(Loader, 'ui-loader'));
});

describe('Button, React', () => {
  buttonContract(mountReactButton);
});

describe('TextField, React', () => {
  textFieldContract(mountReactTextField);
});
