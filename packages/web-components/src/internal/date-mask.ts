import { dateMaskOptions } from '@mszczygiel-projects/ui-core-shared/date';
import IMask from 'imask';

/** Owns only the DOM mask; calendar parsing and validation remain in shared. */
export class DateMask {
  private mask?: ReturnType<typeof IMask>;

  private locale?: string;

  private events?: AbortController;

  private composing = false;

  update(input: HTMLInputElement, locale: string, onMaskEdit: (event: Event) => void): void {
    if (input.readOnly || input.disabled) {
      this.disconnect();
      return;
    }
    if (this.locale !== locale || this.mask === undefined) {
      this.disconnect();
      this.locale = locale;
      this.mask = IMask(input, { ...dateMaskOptions(locale) });
      const events = new AbortController();
      this.events = events;
      const options = { signal: events.signal };
      let inputVersion = 0;
      input.addEventListener(
        'input',
        () => {
          inputVersion += 1;
        },
        options,
      );
      // History and composition can change the mask without a native input event.
      input.addEventListener(
        'keydown',
        (event) => {
          if (event.defaultPrevented) {
            onMaskEdit(event);
          }
        },
        options,
      );
      input.addEventListener(
        'beforeinput',
        (event) => {
          if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
            onMaskEdit(event);
          }
        },
        options,
      );
      input.addEventListener(
        'compositionstart',
        () => {
          this.composing = true;
        },
        options,
      );
      input.addEventListener(
        'compositionend',
        (event) => {
          this.composing = false;
          const version = inputVersion;
          queueMicrotask(() => {
            if (!events.signal.aborted && version === inputVersion) {
              onMaskEdit(event);
            }
          });
        },
        options,
      );
    }
    if (!this.composing) {
      this.mask.updateValue();
    }
  }

  disconnect(): void {
    this.events?.abort();
    this.composing = false;
    this.mask?.destroy();
    this.mask = undefined;
  }
}
