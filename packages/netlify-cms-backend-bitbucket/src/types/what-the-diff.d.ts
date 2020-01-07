declare module 'what-the-diff' {
  export const parse: (
    diff: string,
  ) => {
    oldPath: string;
    newPath: string;
    status: string;
  }[];
}
