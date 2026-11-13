import '@mszczygiel-projects/ui-core-web-components/accordion';
import '@mszczygiel-projects/ui-core-web-components/accordion-item';
import '@mszczygiel-projects/ui-core-web-components/badge';
import '@mszczygiel-projects/ui-core-web-components/breadcrumbs';
import '@mszczygiel-projects/ui-core-web-components/button';
import '@mszczygiel-projects/ui-core-web-components/calendar';
import '@mszczygiel-projects/ui-core-web-components/checkbox-field';
import '@mszczygiel-projects/ui-core-web-components/chip';
import '@mszczygiel-projects/ui-core-web-components/combobox';
import '@mszczygiel-projects/ui-core-web-components/date-field';
import '@mszczygiel-projects/ui-core-web-components/date-time-field';
import '@mszczygiel-projects/ui-core-web-components/dialog';
import '@mszczygiel-projects/ui-core-web-components/drawer';
import '@mszczygiel-projects/ui-core-web-components/file-input-field';
import '@mszczygiel-projects/ui-core-web-components/icon-button';
import '@mszczygiel-projects/ui-core-web-components/link-button';
import '@mszczygiel-projects/ui-core-web-components/listbox';
import '@mszczygiel-projects/ui-core-web-components/loader';
import '@mszczygiel-projects/ui-core-web-components/menu';
import '@mszczygiel-projects/ui-core-web-components/notification';
import '@mszczygiel-projects/ui-core-web-components/number-field';
import '@mszczygiel-projects/ui-core-web-components/pagination';
import '@mszczygiel-projects/ui-core-web-components/password-field';
import '@mszczygiel-projects/ui-core-web-components/popover';
import '@mszczygiel-projects/ui-core-web-components/radio-field';
import '@mszczygiel-projects/ui-core-web-components/radio-group';
import '@mszczygiel-projects/ui-core-web-components/search-field';
import '@mszczygiel-projects/ui-core-web-components/select-field';
import '@mszczygiel-projects/ui-core-web-components/split-button';
import '@mszczygiel-projects/ui-core-web-components/switch-field';
import '@mszczygiel-projects/ui-core-web-components/tab';
import '@mszczygiel-projects/ui-core-web-components/tabs';
import '@mszczygiel-projects/ui-core-web-components/text-field';
import '@mszczygiel-projects/ui-core-web-components/textarea-field';
import '@mszczygiel-projects/ui-core-web-components/time-field';
import '@mszczygiel-projects/ui-core-web-components/tooltip';

import { describe } from 'vitest';

import { mountWebComponentAccordion } from '../harness/accordion.tsx';
import { mountWebComponentAccordionItem } from '../harness/accordion-item.tsx';
import { mountWebComponentBadge } from '../harness/badge.tsx';
import { mountWebComponentBreadcrumbs } from '../harness/breadcrumbs.tsx';
import { mountWebComponentButton } from '../harness/button.tsx';
import { mountWebComponentCalendar } from '../harness/calendar.tsx';
import { mountWebComponentCheckboxField } from '../harness/checkbox-field.tsx';
import { mountWebComponentChip } from '../harness/chip.tsx';
import { mountWebComponentCombobox } from '../harness/combobox.tsx';
import { mountWebComponentDateField } from '../harness/date-field.tsx';
import { mountWebComponentDateTimeField } from '../harness/date-time-field.tsx';
import { mountWebComponentDialog } from '../harness/dialog.tsx';
import { mountWebComponentDrawer } from '../harness/drawer.tsx';
import { mountWebComponentFileInputField } from '../harness/file-input-field.tsx';
import { mountWebComponentIconButton } from '../harness/icon-button.tsx';
import { mountWebComponentLinkButton } from '../harness/link-button.tsx';
import { mountWebComponentListbox } from '../harness/listbox.tsx';
import { mountWebComponentMenu } from '../harness/menu.tsx';
import { mountWebComponentNotification } from '../harness/notification.tsx';
import { mountWebComponentNumberField } from '../harness/number-field.tsx';
import { mountWebComponentPagination } from '../harness/pagination.tsx';
import { mountWebComponentPasswordField } from '../harness/password-field.tsx';
import { mountWebComponentPopover } from '../harness/popover.tsx';
import { mountWebComponentRadioField } from '../harness/radio-field.tsx';
import { mountWebComponentRadioGroup } from '../harness/radio-group.tsx';
import { mountWebComponentSearchField } from '../harness/search-field.tsx';
import { mountWebComponentSelectField } from '../harness/select-field.tsx';
import { mountWebComponentSplitButton } from '../harness/split-button.tsx';
import { mountWebComponentSwitchField } from '../harness/switch-field.tsx';
import { mountWebComponentTab } from '../harness/tab.tsx';
import { mountWebComponentTabs } from '../harness/tabs.tsx';
import { mountWebComponentTextField } from '../harness/text-field.tsx';
import { mountWebComponentTextareaField } from '../harness/textarea-field.tsx';
import { mountWebComponentTimeField } from '../harness/time-field.tsx';
import { mountWebComponentTooltip } from '../harness/tooltip.tsx';
import { webComponentMount } from '../harness/web-component.ts';
import { accordionContract } from '../specs/accordion.contract.ts';
import { accordionItemContract } from '../specs/accordion-item.contract.ts';
import { badgeContract } from '../specs/badge.contract.ts';
import { breadcrumbsContract } from '../specs/breadcrumbs.contract.ts';
import { buttonContract } from '../specs/button.contract.ts';
import { calendarContract } from '../specs/calendar.contract.ts';
import { checkboxFieldContract } from '../specs/checkbox-field.contract.ts';
import { chipContract } from '../specs/chip.contract.ts';
import { comboboxContract } from '../specs/combobox.contract.ts';
import { dateFieldContract } from '../specs/date-field.contract.ts';
import { dateTimeFieldContract } from '../specs/date-time-field.contract.ts';
import { dialogContract } from '../specs/dialog.contract.ts';
import { drawerContract } from '../specs/drawer.contract.ts';
import { fileInputFieldContract } from '../specs/file-input-field.contract.ts';
import { iconButtonContract } from '../specs/icon-button.contract.ts';
import { linkButtonContract } from '../specs/link-button.contract.ts';
import { listboxContract } from '../specs/listbox.contract.ts';
import { loaderContract } from '../specs/loader.contract.ts';
import { menuContract } from '../specs/menu.contract.ts';
import { notificationContract } from '../specs/notification.contract.ts';
import { numberFieldContract } from '../specs/number-field.contract.ts';
import { sharedScrollLockContract } from '../specs/overlay.contract.ts';
import { paginationContract } from '../specs/pagination.contract.ts';
import { passwordFieldContract } from '../specs/password-field.contract.ts';
import { popoverContract } from '../specs/popover.contract.ts';
import { radioFieldContract } from '../specs/radio-field.contract.ts';
import { radioGroupContract } from '../specs/radio-group.contract.ts';
import { searchFieldContract } from '../specs/search-field.contract.ts';
import { selectFieldContract } from '../specs/select-field.contract.ts';
import { splitButtonContract } from '../specs/split-button.contract.ts';
import { switchFieldContract } from '../specs/switch-field.contract.ts';
import { tabContract } from '../specs/tab.contract.ts';
import { tabsContract } from '../specs/tabs.contract.ts';
import { textFieldContract } from '../specs/text-field.contract.ts';
import { textareaFieldContract } from '../specs/textarea-field.contract.ts';
import { timeFieldContract } from '../specs/time-field.contract.ts';
import { tooltipContract } from '../specs/tooltip.contract.ts';

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

describe('Combobox, web component', () => {
  comboboxContract(mountWebComponentCombobox);
});

describe('Dialog, web component', () => {
  dialogContract(mountWebComponentDialog);
});

describe('Drawer, web component', () => {
  drawerContract(mountWebComponentDrawer);
});

describe('Drawer and Dialog, web components', () => {
  sharedScrollLockContract(mountWebComponentDrawer, { label: 'Filters' }, mountWebComponentDialog, {
    heading: 'Delete file',
  });
});

describe('FileInputField, web component', () => {
  fileInputFieldContract(mountWebComponentFileInputField);
});

describe('Breadcrumbs, web component', () => {
  breadcrumbsContract(mountWebComponentBreadcrumbs);
});

describe('Pagination, web component', () => {
  paginationContract(mountWebComponentPagination);
});

describe('Popover, web component', () => {
  popoverContract(mountWebComponentPopover);
});

describe('Tooltip, web component', () => {
  tooltipContract(mountWebComponentTooltip);
});

describe('Calendar, web component', () => {
  calendarContract(mountWebComponentCalendar);
});

describe('Menu, web component', () => {
  menuContract(mountWebComponentMenu);
});

describe('SplitButton, web component', () => {
  splitButtonContract(mountWebComponentSplitButton);
});

describe('Accordion, web component', () => {
  accordionContract(mountWebComponentAccordion);
});

describe('AccordionItem, web component', () => {
  accordionItemContract(mountWebComponentAccordionItem);
});

describe('Tabs, web component', () => {
  tabsContract(mountWebComponentTabs);
});

describe('Tab, web component', () => {
  tabContract(mountWebComponentTab);
});

describe('TimeField, web component', () => {
  timeFieldContract(mountWebComponentTimeField);
});

describe('DateTimeField, web component', () => {
  dateTimeFieldContract(mountWebComponentDateTimeField);
});
