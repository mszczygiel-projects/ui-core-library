export type ScrollLockStyles = Readonly<Record<string, string>>;
export declare function lockScroll(owner: object, apply: () => ScrollLockStyles): void;
export declare function unlockScroll(owner: object, restore: (saved: ScrollLockStyles) => void): void;
export declare function isScrollLocked(): boolean;
