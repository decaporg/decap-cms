declare module 'what-the-diff' {
  export const parse: (
    rawDiff: string,
  ) => { oldPath?: string; newPath?: string; binary: boolean; status: string }[];
}
