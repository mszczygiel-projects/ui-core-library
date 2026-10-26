export type MatchMode = 'contains' | 'startsWith';
export declare function foldText(text: string): string;
export declare function matchText(candidate: string, query: string, mode?: MatchMode): boolean;
