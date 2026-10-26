declare module 'virtual:ui-core/react-api' {
  /** The API of every component of the React package, read from its types when the site builds. */
  const api: readonly {
    readonly name: string;
    readonly description: string;
    readonly props: readonly {
      readonly name: string;
      readonly type: string;
      readonly required: boolean;
      readonly defaultValue?: string;
      readonly description: string;
    }[];
  }[];
  export default api;
}
