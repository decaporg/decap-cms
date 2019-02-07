import { filter, flow, fromPairs, map } from "lodash/fp";
import minimatch from "minimatch";

//
// Pointer file parsing

const splitIntoLines = str => str.split("\n");
const splitIntoWords = str => str.split(/\s+/g);
const isNonEmptyString = str => str !== "";
const withoutEmptyLines = flow([
  map(str => str.trim()),
  filter(isNonEmptyString)
]);
export const parsePointerFile = flow([
  splitIntoLines,
  withoutEmptyLines,
  map(splitIntoWords),
  fromPairs,
  ({ size, oid, ...rest }) => ({
    size: parseInt(size),
    sha: oid.split(":")[1],
    ...rest
  })
]);

export const createPointerFile = ({ size, sha }) => `\
version https://git-lfs.github.com/spec/v1
oid sha256:${sha}
size ${size}
`;

//
// .gitattributes file parsing

const removeGitAttributesCommentsFromLine = line => line.split("#")[0];

const parseGitPatternAttribute = attributeString => {
  // There are three kinds of attribute settings:
  // - a key=val pair sets an attribute to a specific value
  // - a key without a value and a leading hyphen sets an attribute to false
  // - a key without a value and no leading hyphen sets an attribute
  //   to true
  if (attributeString.includes("=")) {
    return attributeString.split("=");
  }
  if (attributeString.startsWith("-")) {
    return [attributeString.slice(1), false];
  }
  return [attributeString, true];
};

const parseGitPatternAttributes = flow([
  map(parseGitPatternAttribute),
  fromPairs
]);

const parseGitAttributesPatternLine = flow([
  splitIntoWords,
  ([pattern, ...attributes]) => [pattern, parseGitPatternAttributes(attributes)]
]);

const parseGitAttributesFileToPatternAttributePairs = flow([
  splitIntoLines,
  map(removeGitAttributesCommentsFromLine),
  withoutEmptyLines,
  map(parseGitAttributesPatternLine)
]);

export const getLargeMediaPatternsFromGitAttributesFile = flow([
  parseGitAttributesFileToPatternAttributePairs,
  filter(
    ([pattern, attributes]) =>
      attributes.filter === "lfs" &&
      attributes.diff === "lfs" &&
      attributes.merge === "lfs"
  ),
  map(([pattern]) => pattern)
]);

export const matchPath = ({ patterns }, path) =>
  patterns.some(pattern => minimatch(path, pattern, { matchBase: true }));

//
// API interactions

const defaultContentHeaders = {
  Accept: "application/vnd.git-lfs+json",
  ["Content-Type"]: "application/vnd.git-lfs+json"
};

const resourceExists = async ({ rootUrl, requestFunction }, { sha, size }) => {
  const response = await requestFunction({
    url: `${rootUrl}/verify`,
    method: "POST",
    headers: defaultContentHeaders,
    body: JSON.stringify({ oid: sha, size })
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

const getDownloadUrlFromSha = ({ netlifySiteId }, sha) =>
  `https://lm.services.netlify.com/lfsorigin/${netlifySiteId}/${sha}`;

const getResourceDownloadUrls = (clientConfig, sha) =>
  flow([
    map(({ sha }) => [sha, getDownloadUrlFromSha(clientConfig, sha)]),
    fromPairs,
    Promise.resolve.bind(Promise)
  ])(sha);

const uploadOperation = objects => ({
  operation: "upload",
  transfers: ["basic"],
  objects: objects.map(({ sha, ...rest }) => ({ ...rest, oid: sha }))
});

const getResourceUploadUrls = async ({ rootUrl, requestFunction }, objects) => {
  const response = await requestFunction({
    url: `${rootUrl}/objects/batch`,
    method: "POST",
    headers: defaultContentHeaders,
    body: JSON.stringify(uploadOperation(objects))
  });
  return (await response.json()).objects.map(object => {
    if (object.error) {
      throw new Error(object.error.message);
    }
    return object.actions.upload.href;
  });
};

const uploadBlob = (clientConfig, uploadUrl, blob) =>
  fetch(uploadUrl, {
    method: "PUT",
    body: blob
  });

const uploadResource = async (clientConfig, { sha, size }, resource) => {
  const existingFile = await resourceExists(clientConfig, { sha, size });
  if (existingFile) {
    return sha;
  }
  const [uploadUrl] = await getResourceUploadUrls(clientConfig, [
    { sha, size }
  ]);
  await uploadBlob(clientConfig, uploadUrl, resource);
  return sha;
};

//
// Create Large Media client

const configureFn = (config, fn) => (...args) => fn(config, ...args);
export const getClient = clientConfig => {
  const configFns = {
    resourceExists,
    getResourceUploadUrls,
    getResourceDownloadUrls,
    uploadResource,
    matchPath
  };
  const configlessFns = {};
  return flow([
    Object.keys,
    map(key => [key, configureFn(clientConfig, configFns[key])]),
    fromPairs,
    configuredFns => ({
      ...configuredFns,
      ...configlessFns,
      patterns: clientConfig.patterns,
      enabled: clientConfig.patterns.length !== 0
    })
  ])(configFns);
};
