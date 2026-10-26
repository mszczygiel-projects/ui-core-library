import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactButton } from '../harness/button.tsx';
import { reactMount } from '../harness/react.tsx';
import { buttonContract } from '../specs/button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';

describe('Loader, React', () => {
  loaderContract(reactMount(Loader, 'ui-loader'));
});

describe('Button, React', () => {
  buttonContract(mountReactButton);
});
