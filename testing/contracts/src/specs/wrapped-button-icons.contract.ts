import { expect, it } from 'vitest';

import { ICON_SELECTOR, WRAPPED_ICON_TAG } from '../harness/icon.tsx';
import { type Mount, required } from '../harness/types.ts';
import { pixels, tokenValue } from '../tokens.ts';
import type { ButtonContractProps } from './button.contract.ts';
import type { IconButtonContractProps } from './icon-button.contract.ts';
import type { LinkButtonContractProps } from './link-button.contract.ts';
import type { SplitButtonContractProps } from './split-button.contract.ts';

/** Both implementations centre the artwork, including when the host uses its own font size. */
export function wrappedButtonIconsContract(mounts: {
  readonly button: Mount<ButtonContractProps>;
  readonly iconButton: Mount<IconButtonContractProps>;
  readonly splitButton: Mount<SplitButtonContractProps>;
  readonly linkButton: Mount<LinkButtonContractProps>;
}): void {
  const twoIcons = {
    children: 'New item',
    leadingIcon: 'wrapped',
    trailingIcon: 'wrapped',
  } as const;
  const cases = [
    ['Button', 2, () => mounts.button(twoIcons)],
    ['IconButton', 1, () => mounts.iconButton({ label: 'New item', icon: 'wrapped' })],
    ['SplitButton', 2, () => mounts.splitButton(twoIcons)],
    ['LinkButton', 2, () => mounts.linkButton({ ...twoIcons, href: '#new' })],
  ] as const;

  for (const [name, count, mount] of cases) {
    it(`keeps shadow-wrapped ${name} artwork centred when the density changes`, async () => {
      const button = await mount();
      try {
        const frame = required(button.element.parentElement, 'the density frame');
        const wrappers = [...button.element.querySelectorAll<HTMLElement>(WRAPPED_ICON_TAG)];
        expect(wrappers).toHaveLength(count);
        for (const density of ['comfortable', 'compact'] as const) {
          frame.dataset['density'] = density;
          const slotSize = pixels(tokenValue('--button-icon-size', { density }));
          for (const wrapper of wrappers) {
            const svg = required(wrapper.shadowRoot?.querySelector(ICON_SELECTOR), 'the SVG');
            for (const fixedSize of [undefined, '24px'] as const) {
              if (fixedSize === undefined) {
                wrapper.style.removeProperty('--contract-icon-size');
              } else {
                wrapper.style.setProperty('--contract-icon-size', fixedSize);
              }
              const box = wrapper.getBoundingClientRect();
              const artwork = svg.getBoundingClientRect();
              const svgSize = fixedSize === undefined ? slotSize : pixels(fixedSize);
              expect(box.width).toBeCloseTo(slotSize);
              expect(box.height).toBeCloseTo(slotSize);
              expect(artwork.width).toBeCloseTo(svgSize);
              expect(artwork.height).toBeCloseTo(svgSize);
              expect(artwork.x + artwork.width / 2).toBeCloseTo(box.x + box.width / 2);
              expect(artwork.y + artwork.height / 2).toBeCloseTo(box.y + box.height / 2);
            }
          }
        }
      } finally {
        await button.unmount();
      }
    });
  }
}
