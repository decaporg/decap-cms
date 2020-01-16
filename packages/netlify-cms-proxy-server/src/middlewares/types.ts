export type DefaultParams = {
  branch: string;
};

export type EntriesByFolderParams = {
  folder: string;
  extension: string;
  depth: 1;
};

export type EntriesByFilesParams = {
  files: { path: string }[];
};

export type GetEntryParams = {
  path: string;
};
