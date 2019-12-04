declare module 'netlify-cms-lib-util' {
  export const isAbsolutePath: (path: string) => boolean;
  export const resolvePath: (path: string, basePath: string) => string;
  export const EDITORIAL_WORKFLOW_ERROR: 'EDITORIAL_WORKFLOW_ERROR';
  export const resolveMediaFilename: (
    filename: string,
    options: { publicFolder?: string; mediaFolder?: string; collectionFolder?: string },
  ) => string;
  export const getBlobSHA: (blob: Blob) => string;

  export const Cursor: {
    create: (args: unknown) => Cursor;
    updateStore: (args: unknown) => void;
    actions: Set;
    data: Map;
    meta: Map;
    store: Map;
  };
}
