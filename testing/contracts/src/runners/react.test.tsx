import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactBadge } from '../harness/badge.tsx';
import { mountReactButton } from '../harness/button.tsx';
import { mountReactCheckboxField } from '../harness/checkbox-field.tsx';
import { mountReactChip } from '../harness/chip.tsx';
import { mountReactCombobox } from '../harness/combobox.tsx';
import { mountReactDateField } from '../harness/date-field.tsx';
import { mountReactIconButton } from '../harness/icon-button.tsx';
import { mountReactLinkButton } from '../harness/link-button.tsx';
import { mountReactListbox } from '../harness/listbox.tsx';
import { mountReactNotification } from '../harness/notification.tsx';
import { mountReactNumberField } from '../harness/number-field.tsx';
import { mountReactPasswordField } from '../harness/password-field.tsx';
import { mountReactRadioField } from '../harness/radio-field.tsx';
import { mountReactRadioGroup } from '../harness/radio-group.tsx';
import { reactMount } from '../harness/react.tsx';
import { mountReactSearchField } from '../harness/search-field.tsx';
import { mountReactSelectField } from '../harness/select-field.tsx';
import { mountReactSwitchField } from '../harness/switch-field.tsx';
import { mountReactTextField } from '../harness/text-field.tsx';
import { mountReactTextareaField } from '../harness/textarea-field.tsx';
import { badgeContract } from '../specs/badge.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { checkboxFieldContract } from '../specs/checkbox-field.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { comboboxContract } from '../specs/combobox.contract.ts';
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

describe('CheckboxField, React', () => {
  checkboxFieldContract(mountReactCheckboxField);
});

describe('SwitchField, React', () => {
  switchFieldContract(mountReactSwitchField);
});

describe('RadioGroup, React', () => {
  radioGroupContract(mountReactRadioGroup);
});

describe('RadioField, React', () => {
  radioFieldContract(mountReactRadioField);
});

describe('Listbox, React', () => {
  listboxContract(mountReactListbox);
});

describe('SelectField, React', () => {
  selectFieldContract(mountReactSelectField);
});

describe('NumberField, React', () => {
  numberFieldContract(mountReactNumberField);
});

describe('DateField, React', () => {
  dateFieldContract(mountReactDateField);
});

describe('Combobox, React', () => {
  comboboxContract(mountReactCombobox);
});
