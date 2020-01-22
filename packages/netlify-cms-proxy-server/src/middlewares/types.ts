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

export type UnpublishedEntryParams = {
  collection: string;
  slug: string;
};

export type UpdateUnpublishedEntryStatusParams = {
  collection: string;
  slug: string;
  newStatus: string;
};

export type PublishUnpublishedEntryParams = {
  collection: string;
  slug: string;
};

export type Entry = { slug: string; path: string; raw: string };

export type Asset = { path: string; content: string; encoding: 'base64' };

export type PersistEntryParams = {
  entry: Entry;
  assets: Asset[];
  options: {
    collectionName?: string;
    commitMessage: string;
    useWorkflow: boolean;
    status: string;
  };
};

export type GetMediaParams = {
  mediaFolder: string;
};

export type GetMediaFileParams = {
  path: string;
};

export type PersistMediaParams = {
  asset: Asset;
  options: {
    commitMessage: string;
  };
};

export type DeleteFileParams = {
  path: string;
  options: {
    commitMessage: string;
  };
};
