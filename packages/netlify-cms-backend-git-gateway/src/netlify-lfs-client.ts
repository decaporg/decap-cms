import { flow, fromPairs, map } from 'lodash/fp';
import minimatch from 'minimatch';
import { ApiRequest, PointerFile } from 'netlify-cms-lib-util';

type MakeAuthorizedRequest = (req: ApiRequest) => Promise<Response>;

type ImageTransformations = { nf_resize: string; w: number; h: number };

type ClientConfig = {
  rootURL: string;
  makeAuthorizedRequest: MakeAuthorizedRequest;
  patterns: string[];
  enabled: boolean;
  transformImages: ImageTransformations | boolean;
};

export const matchPath = ({ patterns }: ClientConfig, path: string) =>
  patterns.some(pattern => minimatch(path, pattern, { matchBase: true }));

//
// API interactions

const defaultContentHeaders = {
  Accept: 'application/vnd.git-lfs+json',
  ['Content-Type']: 'application/vnd.git-lfs+json',
};

const resourceExists = async (
  { rootURL, makeAuthorizedRequest }: ClientConfig,
  { sha, size }: PointerFile,
) => {
  const response = await makeAuthorizedRequest({
    url: `${rootURL}/verify`,
    method: 'POST',
    headers: defaultContentHeaders,
    body: JSON.stringify({ oid: sha, size }),
  });
  if (response.ok) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }

  // TODO: what kind of error to throw here? APIError doesn't seem
  // to fit
};

const getTransofrmationsParams = (t: ImageTransformations) =>
  `?nf_resize=${t.nf_resize}&w=${t.w}&h=${t.h}`;

const getDownloadURL = (
  { rootURL, transformImages: t, makeAuthorizedRequest }: ClientConfig,
  { sha }: PointerFile,
) =>
  makeAuthorizedRequest(
    `${rootURL}/origin/${sha}${
      t && Object.keys(t).length > 0 ? getTransofrmationsParams(t as ImageTransformations) : ''
    }`,
  )
    .then(res => (res.ok ? res : Promise.reject(res)))
    .then(res => res.blob())
    .then(blob => URL.createObjectURL(blob))
    .catch((err: Error) => {
      console.error(err);
      return Promise.resolve('');
    });

const uploadOperation = (objects: PointerFile[]) => ({
  operation: 'upload',
  transfers: ['basic'],
  objects: objects.map(({ sha, ...rest }) => ({ ...rest, oid: sha })),
});

const getResourceUploadURLs = async (
  {
    rootURL,
    makeAuthorizedRequest,
  }: { rootURL: string; makeAuthorizedRequest: MakeAuthorizedRequest },
  objects: PointerFile[],
) => {
  const response = await makeAuthorizedRequest({
    url: `${rootURL}/objects/batch`,
    method: 'POST',
    headers: defaultContentHeaders,
    body: JSON.stringify(uploadOperation(objects)),
  });
  return (await response.json()).objects.map(
    (object: { error?: { message: string }; actions: { upload: { href: string } } }) => {
      if (object.error) {
        throw new Error(object.error.message);
      }
      return object.actions.upload.href;
    },
  );
};

const uploadBlob = (uploadURL: string, blob: Blob) =>
  fetch(uploadURL, {
    method: 'PUT',
    body: blob,
  });

const uploadResource = async (
  clientConfig: ClientConfig,
  { sha, size }: PointerFile,
  resource: Blob,
) => {
  const existingFile = await resourceExists(clientConfig, { sha, size });
  if (existingFile) {
    return sha;
  }
  const [uploadURL] = await getResourceUploadURLs(clientConfig, [{ sha, size }]);
  await uploadBlob(uploadURL, resource);
  return sha;
};

//
// Create Large Media client

const configureFn = (config: ClientConfig, fn: Function) => (...args: unknown[]) =>
  fn(config, ...args);

const clientFns: Record<string, Function> = {
  resourceExists,
  getResourceUploadURLs,
  getDownloadURL,
  uploadResource,
  matchPath,
};

export type Client = {
  resourceExists: (pointer: PointerFile) => Promise<boolean | undefined>;
  getResourceUploadURLs: (objects: PointerFile[]) => Promise<string>;
  getDownloadURL: (pointer: PointerFile) => Promise<string>;
  uploadResource: (pointer: PointerFile, blob: Blob) => Promise<string>;
  matchPath: (path: string) => boolean;
  patterns: string[];
  enabled: boolean;
};

export const getClient = (clientConfig: ClientConfig) => {
  return flow([
    Object.keys,
    map((key: string) => [key, configureFn(clientConfig, clientFns[key])]),
    fromPairs,
    configuredFns => ({
      ...configuredFns,
      patterns: clientConfig.patterns,
      enabled: clientConfig.enabled,
    }),
  ])(clientFns);
};
