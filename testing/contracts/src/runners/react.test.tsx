import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { reactMount } from '../harness/react.tsx';
import { loaderContract } from '../specs/loader.contract.ts';

describe('Loader, React', () => {
  loaderContract(reactMount(Loader, 'ui-loader'));
});
