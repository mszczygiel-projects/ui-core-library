/** The media features that the contracts emulate, as Playwright names them. */
export interface MediaFeatures {
  readonly reducedMotion?: 'reduce' | 'no-preference' | null;
  readonly forcedColors?: 'active' | 'none' | null;
}

/** A node of the accessibility tree of the browser. */
export interface AccessibleNode {
  readonly role: string;
  readonly name: string;
  readonly description?: string;
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia: (features: MediaFeatures) => Promise<void>;
    accessibleNode: (frameId: string) => Promise<AccessibleNode>;
    accessibleTree: (frameId: string) => Promise<readonly AccessibleNode[]>;
  }
}
