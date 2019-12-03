declare module 'netlify-cms-lib-util' {
  export const resolvePath: (path: string, basePath: string) => string;
  export const EDITORIAL_WORKFLOW_ERROR: 'EDITORIAL_WORKFLOW_ERROR';
  export const resolveMediaFilename: (
    filename: string,
    options: { publicFolder?: string; mediaFolder?: string; collectionFolder?: string },
  ) => string;
  export const getBlobSHA: (blob: Blob) => string;
}
