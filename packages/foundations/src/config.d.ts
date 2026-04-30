export type LoaderVariant = 'spinner';
export type IconSet = 'default' | 'heroicons';
export interface UiCoreConfig {
  loaderVariant: LoaderVariant;
  iconSet: IconSet;
  toastContainer: string | HTMLElement | null;
  locale: string;
  dir: 'ltr' | 'rtl';
}
export declare function configureUiCore(overrides: Partial<UiCoreConfig>): void;
export declare function getUiCoreConfig(): Readonly<UiCoreConfig>;
