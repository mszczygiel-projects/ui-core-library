export type LoaderVariant = 'spinner';
export type IconSet = 'default' | 'heroicons';

export interface UiCoreConfig {
  loaderVariant: LoaderVariant;

  iconSet: IconSet;

  // Toast / Notification — gdzie montować portal
  // (React potrzebuje wiedzieć gdzie renderować poza drzewem)
  toastContainer: string | HTMLElement | null; // selektor lub ref

  // Domyślny język dla komponentów z wbudowanymi stringami
  // (np. DatePicker, FileUpload — "Drop files here", "No results")
  locale: string; // 'en' | 'pl' | ...

  // Kierunek tekstu — jeśli będziesz wspierać RTL
  dir: 'ltr' | 'rtl';
}

const config: UiCoreConfig = {
  loaderVariant: 'spinner',
  iconSet: 'default',
  toastContainer: null,
  locale: 'en',
  dir: 'ltr',
};

export function configureUiCore(overrides: Partial<UiCoreConfig>): void {
  Object.assign(config, overrides);
}

export function getUiCoreConfig(): Readonly<UiCoreConfig> {
  return config;
}
