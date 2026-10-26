import type { VNode } from '@stencil/core';

// Stencil's JSX namespace declares no element type, so every JSX expression would be `any`. Its
// factory returns a VNode, and naming that type lets the compiler and the linter check renders.
declare module '@stencil/core' {
  export namespace h {
    export namespace JSX {
      export type Element = VNode;
    }
  }
}
