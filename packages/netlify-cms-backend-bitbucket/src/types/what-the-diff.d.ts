declare module 'what-the-diff' {
  export const parse: (rawDiff: string) => { newPath: string; binary: boolean; status: string }[];
}
