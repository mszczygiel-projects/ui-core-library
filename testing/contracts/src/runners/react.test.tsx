import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactBadge } from '../harness/badge.tsx';
import { mountReactButton } from '../harness/button.tsx';
import { mountReactChip } from '../harness/chip.tsx';
import { mountReactIconButton } from '../harness/icon-button.tsx';
import { mountReactLinkButton } from '../harness/link-button.tsx';
import { mountReactNotification } from '../harness/notification.tsx';
import { reactMount } from '../harness/react.tsx';
import { mountReactTextField } from '../harness/text-field.tsx';
import { badgeContract } from '../specs/badge.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { iconButtonContract } from '../specs/icon-button.contract.ts';
import { linkButtonContract } from '../specs/link-button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { notificationContract } from '../specs/notification.contract.ts';
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

describe('IconButton, React', () => {
  iconButtonContract(mountReactIconButton);
});

describe('LinkButton, React', () => {
  linkButtonContract(mountReactLinkButton);
});

describe('Badge, React', () => {
  badgeContract(mountReactBadge);
});

describe('Chip, React', () => {
  chipContract(mountReactChip);
});

describe('Notification, React', () => {
  notificationContract(mountReactNotification);
});
