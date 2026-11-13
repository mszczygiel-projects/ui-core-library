import '@mszczygiel-projects/ui-core-web-components/drawer';

import { Loader } from '@mszczygiel-projects/ui-core-react';
import { describe } from 'vitest';

import { mountReactAccordion } from '../harness/accordion.tsx';
import { mountReactAccordionItem } from '../harness/accordion-item.tsx';
import { mountReactBadge } from '../harness/badge.tsx';
import { mountReactBreadcrumbs } from '../harness/breadcrumbs.tsx';
import { mountReactButton } from '../harness/button.tsx';
import { mountReactCalendar } from '../harness/calendar.tsx';
import { mountReactCheckboxField } from '../harness/checkbox-field.tsx';
import { mountReactChip } from '../harness/chip.tsx';
import { mountReactCombobox } from '../harness/combobox.tsx';
import { mountReactDateField } from '../harness/date-field.tsx';
import { mountReactDateTimeField } from '../harness/date-time-field.tsx';
import { mountReactDialog } from '../harness/dialog.tsx';
import { mountReactDrawer, mountWebComponentDrawer } from '../harness/drawer.tsx';
import { mountReactFileInputField } from '../harness/file-input-field.tsx';
import { mountReactIconButton } from '../harness/icon-button.tsx';
import { mountReactLinkButton } from '../harness/link-button.tsx';
import { mountReactListbox } from '../harness/listbox.tsx';
import { mountReactMenu } from '../harness/menu.tsx';
import { mountReactNotification } from '../harness/notification.tsx';
import { mountReactNumberField } from '../harness/number-field.tsx';
import { mountReactPagination } from '../harness/pagination.tsx';
import { mountReactPasswordField } from '../harness/password-field.tsx';
import { mountReactPopover } from '../harness/popover.tsx';
import { mountReactRadioField } from '../harness/radio-field.tsx';
import { mountReactRadioGroup } from '../harness/radio-group.tsx';
import { reactMount } from '../harness/react.tsx';
import { mountReactSearchField } from '../harness/search-field.tsx';
import { mountReactSelectField } from '../harness/select-field.tsx';
import { mountReactSplitButton } from '../harness/split-button.tsx';
import { mountReactSwitchField } from '../harness/switch-field.tsx';
import { mountReactTab } from '../harness/tab.tsx';
import { mountReactTabs } from '../harness/tabs.tsx';
import { mountReactTextField } from '../harness/text-field.tsx';
import { mountReactTextareaField } from '../harness/textarea-field.tsx';
import { mountReactTimeField } from '../harness/time-field.tsx';
import { mountReactTooltip } from '../harness/tooltip.tsx';
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

describe('Dialog, React', () => {
  dialogContract(mountReactDialog);
});

describe('Drawer, React', () => {
  drawerContract(mountReactDrawer);
});

describe('Drawer and Dialog, React', () => {
  sharedScrollLockContract(mountReactDrawer, { label: 'Filters' }, mountReactDialog, {
    heading: 'Delete file',
  });
});

describe('Drawer of the web components under Dialog of React', () => {
  sharedScrollLockContract(mountWebComponentDrawer, { label: 'Filters' }, mountReactDialog, {
    heading: 'Delete file',
  });
});

describe('FileInputField, React', () => {
  fileInputFieldContract(mountReactFileInputField);
});

describe('Breadcrumbs, React', () => {
  breadcrumbsContract(mountReactBreadcrumbs);
});

describe('Pagination, React', () => {
  paginationContract(mountReactPagination);
});

describe('Popover, React', () => {
  popoverContract(mountReactPopover);
});

describe('Tooltip, React', () => {
  tooltipContract(mountReactTooltip);
});

describe('Calendar, React', () => {
  calendarContract(mountReactCalendar);
});

describe('Menu, React', () => {
  menuContract(mountReactMenu);
});

describe('SplitButton, React', () => {
  splitButtonContract(mountReactSplitButton);
});

describe('Accordion, React', () => {
  accordionContract(mountReactAccordion);
});

describe('AccordionItem, React', () => {
  accordionItemContract(mountReactAccordionItem);
});

describe('Tabs, React', () => {
  tabsContract(mountReactTabs);
});

describe('Tab, React', () => {
  tabContract(mountReactTab);
});

describe('TimeField, React', () => {
  timeFieldContract(mountReactTimeField);
});

describe('DateTimeField, React', () => {
  dateTimeFieldContract(mountReactDateTimeField);
});
