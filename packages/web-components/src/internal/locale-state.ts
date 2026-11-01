/** A parsed field's saved draft: localized text means nothing without the locale that wrote it. */
export interface LocaleState {
  readonly text: string;
  readonly locale: string;
}

/** The string a browser saves for form restoration. */
export function saveLocaleState(state: LocaleState): string {
  return JSON.stringify(state);
}

/** The draft and its locale, or null for a plain string the browser saved earlier. */
export function restoreLocaleState(state: string): LocaleState | null {
  try {
    const saved: unknown = JSON.parse(state);
    if (
      typeof saved === 'object' &&
      saved !== null &&
      'text' in saved &&
      typeof saved.text === 'string' &&
      'locale' in saved &&
      typeof saved.locale === 'string'
    ) {
      return { text: saved.text, locale: saved.locale };
    }
  } catch {
    // Not JSON: a plain string from an earlier state.
  }
  return null;
}
