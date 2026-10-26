/**
 * The language a component formats in, chosen from the candidates it has, so that a server render
 * and the browser choose the same one.
 */

const DEFAULT_LOCALE = 'en-US';

/**
 * The first candidate that is a valid language tag the runtime has data for, in its canonical
 * form, such as `pl-PL` for `pl-pl`, or `en-US` when none is. Empty and invalid candidates are
 * skipped, so a component can pass its own locale, then the configured one, then the browser's
 * once it runs in a browser. A tag without data, such as `zz` or the typo `po`, is skipped too:
 * `Intl` would format it in the language of the machine, which a server and a browser do not share.
 */
export function resolveLocale(...candidates: readonly (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    if (candidate) {
      try {
        const [canonical] = Intl.getCanonicalLocales(candidate);
        if (
          canonical !== undefined &&
          Intl.DateTimeFormat.supportedLocalesOf(canonical).length > 0
        ) {
          return canonical;
        }
      } catch {
        // Not a language tag: the next candidate may be one.
      }
    }
  }
  return DEFAULT_LOCALE;
}
