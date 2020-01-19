import { filter, flow, fromPairs, map } from 'lodash/fp';
import minimatch from 'minimatch';
import { ApiRequest } from 'netlify-cms-lib-util';
import { API as bitbucketAPI } from 'netlify-cms-backend-bitbucket';
import { API as githubAPI } from 'netlify-cms-backend-github';
import { API as gitlabAPI } from 'netlify-cms-backend-gitlab';

type anyAPI = bitbucketAPI | githubAPI | gitlabAPI;

export interface PointerFile {
  size: number;
  sha: string;
}

type MakeAuthorizedRequest = (req: ApiRequest) => Promise<Response>;

interface LfsBatchAction {
  href: string;
  header?: { [key: string]: string };
  expires_in?: number;
  expires_at?: string;
}

interface LfsBatchObject {
  oid: string;
  size: number;
}

interface LfsBatchObjectUpload extends LfsBatchObject {
  actions?: {
    upload: LfsBatchAction;
    verify?: LfsBatchAction;
  };
}

interface LfsBatchObjectError extends LfsBatchObject {
  error: {
    code: number;
    message: string;
  };
}

interface LfsBatchUploadResponse {
  transfer?: string;
  objects: (LfsBatchObjectUpload | LfsBatchObjectError)[];
}

export const createPointerFile = ({ size, sha }: PointerFile) => `\
version https://git-lfs.github.com/spec/v1
oid sha256:${sha}
size ${size}
`;

export class GitLfsClient {
  private static defaultContentHeaders = {
    Accept: 'application/vnd.git-lfs+json',
    ['Content-Type']: 'application/vnd.git-lfs+json',
  };

  constructor(
    public enabled: boolean,
    public rootURL: string,
    public patterns: string[],
    private makeAuthorizedRequest: MakeAuthorizedRequest,
  ) {}

  matchPath(path: string) {
    return this.patterns.some(pattern => minimatch(path, pattern, { matchBase: true }));
  }

  async uploadResource(pointer: PointerFile, resource: Blob): Promise<string> {
    const requests = await this.getResourceUploadRequests([pointer]);
    for (const request of requests) {
      await this.doUpload(request.actions!.upload, resource);
      if (request.actions!.verify) {
        await this.doVerify(request.actions!.verify, request);
      }
    }
    return pointer.sha;
  }

  private async doUpload(upload: LfsBatchAction, resource: Blob) {
    await fetch(decodeURI(upload.href), {
      method: 'PUT',
      body: resource,
      headers: upload.header,
    });
  }
  private async doVerify(verify: LfsBatchAction, object: LfsBatchObject) {
    this.makeAuthorizedRequest({
      url: decodeURI(verify.href),
      method: 'POST',
      headers: { ...GitLfsClient.defaultContentHeaders, ...verify.header },
      body: JSON.stringify({ oid: object.oid, size: object.size }),
    });
  }

  private async getResourceUploadRequests(objects: PointerFile[]): Promise<LfsBatchObjectUpload[]> {
    const response = await this.makeAuthorizedRequest({
      url: `${this.rootURL}/objects/batch`,
      method: 'POST',
      headers: GitLfsClient.defaultContentHeaders,
      body: JSON.stringify({
        operation: 'upload',
        transfers: ['basic'],
        objects: objects.map(({ sha, ...rest }) => ({ ...rest, oid: sha })),
      }),
    });
    return ((await response.json()) as LfsBatchUploadResponse).objects.filter(object => {
      if ('error' in object) {
        console.error(object.error);
        return false;
      }
      return object.actions;
    });
  }
}

//
// Pointer file parsing

const splitIntoLines = (str: string) => str.split('\n');
const splitIntoWords = (str: string) => str.split(/\s+/g);
const isNonEmptyString = (str: string) => str !== '';
const withoutEmptyLines = flow([map((str: string) => str.trim()), filter(isNonEmptyString)]);

//
// .gitattributes file parsing

const removeGitAttributesCommentsFromLine = (line: string) => line.split('#')[0];

const parseGitPatternAttribute = (attributeString: string) => {
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
};

const parseGitPatternAttributes = flow([map(parseGitPatternAttribute), fromPairs]);

const parseGitAttributesPatternLine = flow([
  splitIntoWords,
  ([pattern, ...attributes]) => [pattern, parseGitPatternAttributes(attributes)],
]);

const parseGitAttributesFileToPatternAttributePairs = flow([
  splitIntoLines,
  map(removeGitAttributesCommentsFromLine),
  withoutEmptyLines,
  map(parseGitAttributesPatternLine),
]);

const getLargeMediaPatternsFromGitAttributesFile = flow([
  parseGitAttributesFileToPatternAttributePairs,
  filter(
    ([, attributes]) =>
      attributes.filter === 'lfs' && attributes.diff === 'lfs' && attributes.merge === 'lfs',
  ),
  map(([pattern]) => pattern),
]);

export function getLFSPatterns(api: anyAPI): Promise<{ err: Error | null; patterns: string[] }> {
  return api
    .readFile('.gitattributes')
    .then(attributes => getLargeMediaPatternsFromGitAttributesFile(attributes as string))
    .then((patterns: string[]) => ({ err: null, patterns }))
    .catch((err: Error) => {
      if (err.message.includes('404')) {
        console.log('This 404 was expected and handled appropriately.');
        return { err: null, patterns: [] as string[] };
      } else {
        return { err, patterns: [] as string[] };
      }
    });
}
