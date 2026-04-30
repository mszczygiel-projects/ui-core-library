const config = {
  loaderVariant: 'spinner',
  iconSet: 'default',
  toastContainer: null,
  locale: 'en',
  dir: 'ltr',
};
export function configureUiCore(overrides) {
  Object.assign(config, overrides);
}
export function getUiCoreConfig() {
  return config;
}
