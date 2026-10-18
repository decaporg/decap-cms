//
// Pointer file parsing

import flow from 'lodash/flow';
import fromPairs from 'lodash/fromPairs';

import getBlobSHA from './getBlobSHA';

import type { AssetProxy } from './implementation';

export interface PointerFile {
  size: number;
  sha: string;
}

function splitIntoLines(str: string) {
  return str.split('\n');
}

function splitIntoWords(str: string) {
  return str.split(/\s+/g);
}

function isNonEmptyString(str: string) {
  return str !== '';
}

const withoutEmptyLines = flow([
  (lines: string[]) => lines.map(str => str.trim()),
  (lines: string[]) => lines.filter(isNonEmptyString),
]);
export const parsePointerFile: (data: string) => PointerFile = flow([
  splitIntoLines,
  withoutEmptyLines,
  (lines: string[]) => lines.map(splitIntoWords),
  fromPairs,
  ({ size, oid, ...rest }) => ({
    size: parseInt(size),
    sha: oid?.split(':')[1],
    ...rest,
  }),
]);

//
// .gitattributes file parsing

function removeGitAttributesCommentsFromLine(line: string) {
  return line.split('#')[0];
}

function parseGitPatternAttribute(attributeString: string) {
  // There are three kinds of attribute settings:
  // - a key=val pair sets an attribute to a specific value
  // - a key without a value and a leading hyphen sets an attribute to false
  // - a key without a value and no leading hyphen sets an attribute
  //   to true
  if (attributeString.includes('=')) {
    return attributeString.split('=');
  }
  if (attributeString.startsWith('-')) {
    return [attributeString.slice(1), false];
  }
  return [attributeString, true];
}

const parseGitPatternAttributes = flow([
  (attributes: string[]) => attributes.map(parseGitPatternAttribute),
  fromPairs,
]);

const parseGitAttributesPatternLine = flow([
  splitIntoWords,
  ([pattern, ...attributes]) => [pattern, parseGitPatternAttributes(attributes)],
]);

const parseGitAttributesFileToPatternAttributePairs = flow([
  splitIntoLines,
  (lines: string[]) => lines.map(removeGitAttributesCommentsFromLine),
  withoutEmptyLines,
  (lines: string[]) => lines.map(line => parseGitAttributesPatternLine(line)),
]);

export const getLargeMediaPatternsFromGitAttributesFile = flow([
  parseGitAttributesFileToPatternAttributePairs,
  (pairs: [string, Record<string, string | boolean>][]) =>
    pairs.filter(
      ([, attributes]) =>
        attributes.filter === 'lfs' && attributes.diff === 'lfs' && attributes.merge === 'lfs',
    ),
  (pairs: [string, Record<string, string | boolean>][]) => pairs.map(([pattern]) => pattern),
]);

export function createPointerFile({ size, sha }: PointerFile) {
  return `\
version https://git-lfs.github.com/spec/v1
oid sha256:${sha}
size ${size}
`;
}

export async function getPointerFileForMediaFileObj(
  client: { uploadResource: (pointer: PointerFile, resource: Blob) => Promise<string> },
  fileObj: File,
  path: string,
) {
  const { name, size } = fileObj;
  const sha = await getBlobSHA(fileObj);
  await client.uploadResource({ sha, size }, fileObj);
  const pointerFileString = createPointerFile({ sha, size });
  const pointerFileBlob = new Blob([pointerFileString]);
  const pointerFile = new File([pointerFileBlob], name, { type: 'text/plain' });
  const pointerFileSHA = await getBlobSHA(pointerFile);
  return {
    fileObj: pointerFile,
    size: pointerFileBlob.size,
    sha: pointerFileSHA,
    raw: pointerFileString,
    path,
  };
}

export async function getLargeMediaFilteredMediaFiles(
  client: {
    uploadResource: (pointer: PointerFile, resource: Blob) => Promise<string>;
    matchPath: (path: string) => boolean;
  },
  mediaFiles: AssetProxy[],
) {
  return await Promise.all(
    mediaFiles.map(async mediaFile => {
      const { fileObj, path } = mediaFile;
      const fixedPath = path.startsWith('/') ? path.slice(1) : path;
      if (!client.matchPath(fixedPath)) {
        return mediaFile;
      }

      const pointerFileDetails = await getPointerFileForMediaFileObj(client, fileObj as File, path);
      return { ...mediaFile, ...pointerFileDetails };
    }),
  );
}
