import type { SwitchFieldProps } from '@mszczygiel-projects/ui-core-shared/switch-field';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import type { Mount, Mounted, MountOptions } from '../harness/types.ts';
import {
  checkboxOf,
  checkedControlContract,
  type CheckedControlContractProps,
} from './choice.contract.ts';

/** The props of the specification, plus what each harness translates: icons as flags. */
export interface SwitchFieldContractProps extends SwitchFieldProps, CheckedControlContractProps {
  readonly iconOn?: boolean;
  readonly iconOff?: boolean;
}

/** The behaviour of SwitchField, applied unchanged to the web component and the React component. */
export function switchFieldContract(adapter: Mount<SwitchFieldContractProps>): void {
  checkedControlContract(adapter, { role: 'switch', sizeToken: '--switch-track-height' });

  const mounted: Mounted<SwitchFieldContractProps>[] = [];
  async function mount(props: SwitchFieldContractProps = {}, options?: MountOptions) {
    const control = await adapter({ label: 'Dark mode', ...props }, options);
    mounted.push(control);
    return control;
  }
  afterEach(async () => {
    for (const control of mounted.splice(0)) {
      await control.unmount();
    }
  });

  it('moves the thumb to the end of the track while on, in reading order', async () => {
    for (const dir of ['ltr', 'rtl'] as const) {
      const control = await mount({}, { attributes: { dir } });
      const track = control.part('control').getBoundingClientRect();
      const offStart = control.part('thumb').getBoundingClientRect();
      await page.elementLocator(checkboxOf(control)).click();
      await expect
        .poll(() => {
          const thumb = control.part('thumb').getBoundingClientRect();
          return dir === 'ltr'
            ? thumb.right > offStart.right && thumb.right <= track.right
            : thumb.left < offStart.left && thumb.left >= track.left;
        })
        .toBe(true);
    }
  });

  it('puts the label at the end by default and at the start on request', async () => {
    const end = await mount();
    expect(end.part('label-text').getBoundingClientRect().left).toBeGreaterThanOrEqual(
      end.part('control').getBoundingClientRect().right,
    );
    const start = await mount({ labelPosition: 'start' });
    expect(start.part('label-text').getBoundingClientRect().right).toBeLessThanOrEqual(
      start.part('control').getBoundingClientRect().left,
    );
    await start.update({ labelPosition: 'unsupported' } as unknown as SwitchFieldContractProps);
    expect(start.part('label-text').getBoundingClientRect().left).toBeGreaterThanOrEqual(
      start.part('control').getBoundingClientRect().right,
    );
  });

  it('shows the icon of the current state only, hidden from readers', async () => {
    const control = await mount({ iconOn: true, iconOff: true });
    const visible = () =>
      [...control.part('thumb').querySelectorAll<HTMLElement>('[class*="icon-o"]')]
        .filter((icon) => getComputedStyle(icon).display !== 'none')
        .map((icon) => (icon.className.includes('icon-on') ? 'on' : 'off'));
    expect(visible()).toEqual(['off']);
    await page.elementLocator(checkboxOf(control)).click();
    expect(visible()).toEqual(['on']);
    const tree = await control.accessibleTree();
    expect(tree.some((node) => node.role === 'img')).toBe(false);
  });

  it('takes no required constraint', async () => {
    const control = await mount();
    expect(checkboxOf(control).required).toBe(false);
  });
}
