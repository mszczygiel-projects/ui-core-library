import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { SelectField } from './SelectField.js';

afterEach(cleanup);

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

describe('SelectField', () => {
  it('renders without error', () => {
    render(<SelectField options={OPTIONS} />);
    expect(document.querySelector('.ui-select-field')).not.toBeNull();
  });

  it('renders trigger button with role=combobox', () => {
    render(<SelectField options={OPTIONS} />);
    expect(screen.getByRole('combobox')).toBeDefined();
  });

  it('dropdown is closed by default', () => {
    render(<SelectField options={OPTIONS} />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('dropdown opens on trigger click', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('dropdown shows all options', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option').length).toBe(3);
  });

  it('clicking an option selects it (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('combobox').textContent).toContain('Apple');
  });

  it('clicking an option closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('calls onChange with selected value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChange).toHaveBeenCalledWith('apple');
  });

  it('does not call onChange when selecting already-selected value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} value="apple" onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled option is not selectable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    const disabledOpt = screen.getByRole('option', { name: 'Cherry' });
    expect(disabledOpt.getAttribute('aria-disabled')).toBe('true');
  });

  it('shows placeholder when no value', () => {
    render(<SelectField options={OPTIONS} placeholder="Pick one..." />);
    expect(screen.getByRole('combobox').textContent).toContain('Pick one...');
  });

  it('shows selected label when value is set', () => {
    render(<SelectField options={OPTIONS} value="banana" />);
    expect(screen.getByRole('combobox').textContent).toContain('Banana');
  });

  it('trigger is disabled when state=disabled', () => {
    render(<SelectField options={OPTIONS} state="disabled" />);
    expect(screen.getByRole('combobox')).toHaveProperty('disabled', true);
  });

  it('trigger is disabled when disabled prop is set', () => {
    render(<SelectField options={OPTIONS} disabled />);
    expect(screen.getByRole('combobox')).toHaveProperty('disabled', true);
  });

  it('renders label element', () => {
    render(<SelectField options={OPTIONS} label="Fruit" />);
    expect(screen.getByText('Fruit')).toBeDefined();
  });

  it('renders hint text', () => {
    render(<SelectField options={OPTIONS} hint="Pick your fruit" />);
    expect(screen.getByText('Pick your fruit')).toBeDefined();
  });

  it('clear button not shown when clearable=false', () => {
    const { container } = render(<SelectField options={OPTIONS} value="apple" clearable={false} />);
    expect(container.querySelector('.ui-select-field__clear')).toBeNull();
  });

  it('clear button shown when clearable and has value', () => {
    const { container } = render(<SelectField options={OPTIONS} value="apple" clearable />);
    expect(container.querySelector('.ui-select-field__clear')).not.toBeNull();
  });

  it('clear button calls onChange with empty string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField options={OPTIONS} value="apple" clearable onChange={onChange} />,
    );
    await user.click(container.querySelector('.ui-select-field__clear')!);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('Delete key clears value when clearable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} value="apple" clearable onChange={onChange} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{Delete}');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('Backspace key clears value when clearable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} value="banana" clearable onChange={onChange} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('Delete key does not clear when clearable is false', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectField options={OPTIONS} value="apple" onChange={onChange} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{Delete}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('trigger has aria-expanded=false when closed', () => {
    render(<SelectField options={OPTIONS} />);
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true');
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens on ArrowDown key', async () => {
    const user = userEvent.setup();
    render(<SelectField options={OPTIONS} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('forwards className to root element', () => {
    const { container } = render(<SelectField options={OPTIONS} className="my-class" />);
    expect(container.firstElementChild!.classList.contains('my-class')).toBe(true);
  });

  it('forwards style to root element', () => {
    const { container } = render(<SelectField options={OPTIONS} style={{ maxWidth: '200px' }} />);
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe('200px');
  });

  it('root element has variant class', () => {
    const { container } = render(<SelectField options={OPTIONS} variant="filled" />);
    expect(container.firstElementChild!.classList.contains('ui-select-field--filled')).toBe(true);
  });

  it('root element has state class', () => {
    const { container } = render(<SelectField options={OPTIONS} state="error" />);
    expect(container.firstElementChild!.classList.contains('ui-select-field--state-error')).toBe(
      true,
    );
  });

  it('root element has size class when non-default', () => {
    const { container } = render(<SelectField options={OPTIONS} size="small" />);
    expect(container.firstElementChild!.classList.contains('ui-select-field--small')).toBe(true);
  });

  it('root element has open class when dropdown is open', async () => {
    const user = userEvent.setup();
    const { container } = render(<SelectField options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(container.firstElementChild!.classList.contains('ui-select-field--open')).toBe(true);
  });

  it('submits value through native select in form data', async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <SelectField name="fruit" options={OPTIONS} />
        <button type="submit">Submit</button>
      </form>,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));

    const form = screen.getByTestId('form') as HTMLFormElement;
    const data = new FormData(form);
    expect(data.get('fruit')).toBe('banana');
  });

  it('resets uncontrolled value to defaultValue on form reset', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <SelectField name="fruit" options={OPTIONS} defaultValue="apple" />
        <button type="reset">Reset</button>
      </form>,
    );

    expect(screen.getByRole('combobox').textContent).toContain('Apple');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByRole('combobox').textContent).toContain('Banana');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('combobox').textContent).toContain('Apple');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('required field fails native form validity when empty', () => {
    render(
      <form data-testid="form">
        <SelectField name="fruit" options={OPTIONS} required />
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
  });

  it('required field passes native form validity when value exists', () => {
    render(
      <form data-testid="form">
        <SelectField name="fruit" options={OPTIONS} required value="apple" />
      </form>,
    );

    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(form.checkValidity()).toBe(true);
  });

  it('clear on Enter does not open dropdown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField options={OPTIONS} value="apple" clearable onChange={onChange} />,
    );

    const clear = container.querySelector('.ui-select-field__clear') as HTMLElement;
    clear.focus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('clear on Space does not open dropdown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField options={OPTIONS} value="apple" clearable onChange={onChange} />,
    );

    const clear = container.querySelector('.ui-select-field__clear') as HTMLElement;
    clear.focus();
    await user.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
