export declare const hasTodo: (s: unknown) => s is string;
export declare function splitTodo(s: string): Array<{ text: string } | { note: string }>;
export declare const isCheck: (note: string, textBefore: string) => boolean;
export declare const tidy: (s: string) => string;
export declare function stripTodo(s: string): string;
export declare function resolveUnit(s: string): string | null;
export declare function resolveProse(runs: string[], where?: string): string[];
