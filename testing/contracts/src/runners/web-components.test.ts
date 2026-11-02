import '@mszczygiel-projects/ui-core-web-components/badge';
import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/checkbox-field';
import '@mszczygiel-projects/ui-core-web-components/chip';
import '@mszczygiel-projects/ui-core-web-components/date-field';
import '@mszczygiel-projects/ui-core-web-components/icon-button';
import '@mszczygiel-projects/ui-core-web-components/link-button';
import '@mszczygiel-projects/ui-core-web-components/listbox';
import '@mszczygiel-projects/ui-core-web-components/loader';
import '@mszczygiel-projects/ui-core-web-components/notification';
import '@mszczygiel-projects/ui-core-web-components/number-field';
import '@mszczygiel-projects/ui-core-web-components/password-field';
import '@mszczygiel-projects/ui-core-web-components/radio-field';
import '@mszczygiel-projects/ui-core-web-components/radio-group';
import '@mszczygiel-projects/ui-core-web-components/search-field';
import '@mszczygiel-projects/ui-core-web-components/select-field';
import '@mszczygiel-projects/ui-core-web-components/switch-field';
import '@mszczygiel-projects/ui-core-web-components/text-field';
import '@mszczygiel-projects/ui-core-web-components/textarea-field';

import { describe } from 'vitest';

import { mountWebComponentBadge } from '../harness/badge.tsx';
import { mountWebComponentButton } from '../harness/button.tsx';
import { mountWebComponentCheckboxField } from '../harness/checkbox-field.tsx';
import { mountWebComponentChip } from '../harness/chip.tsx';
import { mountWebComponentDateField } from '../harness/date-field.tsx';
import { mountWebComponentIconButton } from '../harness/icon-button.tsx';
import { mountWebComponentLinkButton } from '../harness/link-button.tsx';
import { mountWebComponentListbox } from '../harness/listbox.tsx';
import { mountWebComponentNotification } from '../harness/notification.tsx';
import { mountWebComponentNumberField } from '../harness/number-field.tsx';
import { mountWebComponentPasswordField } from '../harness/password-field.tsx';
import { mountWebComponentRadioField } from '../harness/radio-field.tsx';
import { mountWebComponentRadioGroup } from '../harness/radio-group.tsx';
import { mountWebComponentSearchField } from '../harness/search-field.tsx';
import { mountWebComponentSelectField } from '../harness/select-field.tsx';
import { mountWebComponentSwitchField } from '../harness/switch-field.tsx';
import { mountWebComponentTextField } from '../harness/text-field.tsx';
import { mountWebComponentTextareaField } from '../harness/textarea-field.tsx';
import { webComponentMount } from '../harness/web-component.ts';
import { badgeContract } from '../specs/badge.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { checkboxFieldContract } from '../specs/checkbox-field.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { dateFieldContract } from '../specs/date-field.contract.ts';
import { iconButtonContract } from '../specs/icon-button.contract.ts';
import { linkButtonContract } from '../specs/link-button.contract.ts';
import { listboxContract } from '../specs/listbox.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { notificationContract } from '../specs/notification.contract.ts';
import { numberFieldContract } from '../specs/number-field.contract.ts';
import { passwordFieldContract } from '../specs/password-field.contract.ts';
import { radioFieldContract } from '../specs/radio-field.contract.ts';
import { radioGroupContract } from '../specs/radio-group.contract.ts';
import { searchFieldContract } from '../specs/search-field.contract.ts';
import { selectFieldContract } from '../specs/select-field.contract.ts';
import { switchFieldContract } from '../specs/switch-field.contract.ts';
import { textFieldContract } from '../specs/text-field.contract.ts';
import { textareaFieldContract } from '../specs/textarea-field.contract.ts';

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

describe('Notification, web component', () => {
  notificationContract(mountWebComponentNotification);
});

describe('PasswordField, web component', () => {
  passwordFieldContract(mountWebComponentPasswordField);
});

describe('SearchField, web component', () => {
  searchFieldContract(mountWebComponentSearchField);
});

describe('TextareaField, web component', () => {
  textareaFieldContract(mountWebComponentTextareaField);
});

describe('CheckboxField, web component', () => {
  checkboxFieldContract(mountWebComponentCheckboxField);
});

describe('SwitchField, web component', () => {
  switchFieldContract(mountWebComponentSwitchField);
});

describe('RadioGroup, web component', () => {
  radioGroupContract(mountWebComponentRadioGroup);
});

describe('RadioField, web component', () => {
  radioFieldContract(mountWebComponentRadioField);
});

describe('Listbox, web component', () => {
  listboxContract(mountWebComponentListbox);
});

describe('SelectField, web component', () => {
  selectFieldContract(mountWebComponentSelectField);
});

describe('NumberField, web component', () => {
  numberFieldContract(mountWebComponentNumberField);
});

describe('DateField, web component', () => {
  dateFieldContract(mountWebComponentDateField);
});
