import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactBadge } from '../harness/badge.tsx';
import { mountReactButton } from '../harness/button.tsx';
import { mountReactChip } from '../harness/chip.tsx';
import { mountReactIconButton } from '../harness/icon-button.tsx';
import { mountReactLinkButton } from '../harness/link-button.tsx';
import { mountReactNotification } from '../harness/notification.tsx';
import { mountReactPasswordField } from '../harness/password-field.tsx';
import { reactMount } from '../harness/react.tsx';
import { mountReactSearchField } from '../harness/search-field.tsx';
import { mountReactTextField } from '../harness/text-field.tsx';
import { mountReactTextareaField } from '../harness/textarea-field.tsx';
import { badgeContract } from '../specs/badge.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { iconButtonContract } from '../specs/icon-button.contract.ts';
import { linkButtonContract } from '../specs/link-button.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { notificationContract } from '../specs/notification.contract.ts';
import { passwordFieldContract } from '../specs/password-field.contract.ts';
import { searchFieldContract } from '../specs/search-field.contract.ts';
import { textFieldContract } from '../specs/text-field.contract.ts';
import { textareaFieldContract } from '../specs/textarea-field.contract.ts';

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

describe('PasswordField, React', () => {
  passwordFieldContract(mountReactPasswordField);
});

describe('SearchField, React', () => {
  searchFieldContract(mountReactSearchField);
});

describe('TextareaField, React', () => {
  textareaFieldContract(mountReactTextareaField);
});
