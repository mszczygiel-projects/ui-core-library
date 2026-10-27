import '@mszczygiel-projects/ui-core-web-components/badge';
import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/chip';
import '@mszczygiel-projects/ui-core-web-components/icon-button';
import '@mszczygiel-projects/ui-core-web-components/link-button';
import '@mszczygiel-projects/ui-core-web-components/loader';
import '@mszczygiel-projects/ui-core-web-components/text-field';

import { describe } from 'vitest';

import { mountWebComponentBadge } from '../harness/badge.tsx';
import { mountWebComponentButton } from '../harness/button.tsx';
import { mountWebComponentChip } from '../harness/chip.tsx';
import { mountWebComponentIconButton } from '../harness/icon-button.tsx';
import { mountWebComponentLinkButton } from '../harness/link-button.tsx';
import { mountWebComponentTextField } from '../harness/text-field.tsx';
import { webComponentMount } from '../harness/web-component.ts';
import { badgeContract } from '../specs/badge.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { iconButtonContract } from '../specs/icon-button.contract.ts';
import { linkButtonContract } from '../specs/link-button.contract.ts';
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

describe('IconButton, web component', () => {
  iconButtonContract(mountWebComponentIconButton);
});

describe('LinkButton, web component', () => {
  linkButtonContract(mountWebComponentLinkButton);
});

describe('Badge, web component', () => {
  badgeContract(mountWebComponentBadge);
});

describe('Chip, web component', () => {
  chipContract(mountWebComponentChip);
});
