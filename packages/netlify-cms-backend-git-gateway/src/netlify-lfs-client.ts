import { flow, fromPairs, map } from 'lodash/fp';
import { isPlainObject, isEmpty } from 'lodash';
import minimatch from 'minimatch';
import { ApiRequest, PointerFile, unsentRequest } from 'netlify-cms-lib-util';

type MakeAuthorizedRequest = (req: ApiRequest) => Promise<Response>;

type ImageTransformations = { nf_resize: string; w: number; h: number };

type ClientConfig = {
  rootURL: string;
  makeAuthorizedRequest: MakeAuthorizedRequest;
  patterns: string[];
  enabled: boolean;
  transformImages: ImageTransformations | boolean;
};

export function matchPath({ patterns }: ClientConfig, path: string) {
  return patterns.some(pattern => minimatch(path, pattern, { matchBase: true }));
}

//
// API interactions

const defaultContentHeaders = {
  Accept: 'application/vnd.git-lfs+json',
  ['Content-Type']: 'application/vnd.git-lfs+json',
};

async function resourceExists(
  { rootURL, makeAuthorizedRequest }: ClientConfig,
  { sha, size }: PointerFile,
) {
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
}

function getTransofrmationsParams(t: boolean | ImageTransformations) {
  if (isPlainObject(t) && !isEmpty(t)) {
    const { nf_resize: resize, w, h } = t as ImageTransformations;
    return `?nf_resize=${resize}&w=${w}&h=${h}`;
  }
  return '';
}

async function getDownloadURL(
  { rootURL, transformImages: t, makeAuthorizedRequest }: ClientConfig,
  { sha }: PointerFile,
) {
  try {
    const transformation = getTransofrmationsParams(t);
    const transformedPromise = makeAuthorizedRequest(`${rootURL}/origin/${sha}${transformation}`);
    const [transformed, original] = await Promise.all([
      transformedPromise,
      // if transformation is defined, we need to load the original so we have the correct meta data
      transformation ? makeAuthorizedRequest(`${rootURL}/origin/${sha}`) : transformedPromise,
    ]);
    if (!transformed.ok) {
      const error = await transformed.json();
      throw new Error(
        `Failed getting large media for sha '${sha}': '${error.code} - ${error.msg}'`,
      );
    }

    const transformedBlob = await transformed.blob();
    const url = URL.createObjectURL(transformedBlob);
    return { url, blob: transformation ? await original.blob() : transformedBlob };
  } catch (error) {
    console.error(error);
    return { url: '', blob: new Blob() };
  }
}

function uploadOperation(objects: PointerFile[]) {
  return {
    operation: 'upload',
    transfers: ['basic'],
    objects: objects.map(({ sha, ...rest }) => ({ ...rest, oid: sha })),
  };
}

async function getResourceUploadURLs(
  {
    rootURL,
    makeAuthorizedRequest,
  }: { rootURL: string; makeAuthorizedRequest: MakeAuthorizedRequest },
  pointerFiles: PointerFile[],
) {
  const response = await makeAuthorizedRequest({
    url: `${rootURL}/objects/batch`,
    method: 'POST',
    headers: defaultContentHeaders,
    body: JSON.stringify(uploadOperation(pointerFiles)),
  });

  const { objects } = await response.json();
  const uploadUrls = objects.map(
    (object: { error?: { message: string }; actions: { upload: { href: string } } }) => {
      if (object.error) {
        throw new Error(object.error.message);
      }
      return object.actions.upload.href;
    },
  );
  return uploadUrls;
}

function uploadBlob(uploadURL: string, blob: Blob) {
  return unsentRequest.fetchWithTimeout(uploadURL, {
    method: 'PUT',
    body: blob,
  });
}

async function uploadResource(
  clientConfig: ClientConfig,
  { sha, size }: PointerFile,
  resource: Blob,
) {
  const existingFile = await resourceExists(clientConfig, { sha, size });
  if (existingFile) {
    return sha;
  }
  const [uploadURL] = await getResourceUploadURLs(clientConfig, [{ sha, size }]);
  await uploadBlob(uploadURL, resource);
  return sha;
}

//
// Create Large Media client

function configureFn(config: ClientConfig, fn: Function) {
  return (...args: unknown[]) => fn(config, ...args);
}

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
  getDownloadURL: (pointer: PointerFile) => Promise<{ url: string; blob: Blob }>;
  uploadResource: (pointer: PointerFile, blob: Blob) => Promise<string>;
  matchPath: (path: string) => boolean;
  patterns: string[];
  enabled: boolean;
};

export function getClient(clientConfig: ClientConfig) {
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
}
