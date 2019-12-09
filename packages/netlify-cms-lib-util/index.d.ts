declare module 'netlify-cms-lib-util' {
  export const isAbsolutePath: (path: string) => boolean;
  export const basename: (path: string, extension?: string) => string;

  export const EDITORIAL_WORKFLOW_ERROR: 'EDITORIAL_WORKFLOW_ERROR';

  export const getBlobSHA: (blob: Blob) => string;

  export interface CursorType {
    create: (args: unknown) => Cursor;
    updateStore: (args: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unwrapData: () => [Map<string, any>, CursorType];
    actions: Set;
    data: Map;
    meta: Map;
    store: Map;
  }

  export const Cursor: CursorType;

  export const CURSOR_COMPATIBILITY_SYMBOL = Symbol(
    'cursor key for compatibility with old backends',
  );

  export class APIError extends Error {
    status: number;
    constructor(message?: string, responseStatus: number, backend: string);
  }

  export class EditorialWorkflowError extends Error {
    constructor(message?: string, notUnderEditorialWorkflow: boolean);

    notUnderEditorialWorkflow: boolean;
  }

  export const getAllResponses: (url: string, options: RequestInit) => Promise<Response[]>;
  export const flowAsync: (funcs: Function[]) => () => Promise<unknown>;

  export const localForage: {
    setItem: <T>(key: string, item: T) => Promise<T>;
    getItem: <T>(key: string) => Promise<T | null>;
    removeItem: (key: string) => Promise<void>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const onlySuccessfulPromises: (...args: any[]) => any;
  export const resolvePromiseProperties: (
    object: Record<string, Promise<unknown>>,
  ) => Promise<unknown>;

  export type ResponseParser<T> = (res: Response) => Promise<T>;

  export const responseParser: ({ format }: { format: 'blob' | 'json' | 'text' }) => ResponseParser;
}
