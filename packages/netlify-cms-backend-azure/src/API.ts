import { Base64 } from 'js-base64';
import { first, flow, partial, result, trim, trimStart } from 'lodash';
import {
  localForage,
  APIError,
  ApiRequest,
  unsentRequest,
  responseParser,
  AssetProxy,
  PersistOptions,
  readFile,
  CMS_BRANCH_PREFIX,
  DEFAULT_PR_BODY,
  DEFAULT_NETLIFY_CMS_LABEL_PREFIX,
  generateContentKey,
  parseContentKey,
  labelToStatus,
  isCMSLabel,
  EditorialWorkflowError,
  statusToLabel,
  PreviewState,
  readFileMetadata,
} from 'netlify-cms-lib-util';
import { DataFile } from 'netlify-cms-lib-util/src/implementation';

export const API_NAME = 'Azure DevOps';

export class AzureRepo {
  org: string;
  project: string;
  name: string;

  constructor(location?: string | null) {
    if (!location || !/^[^/]+\/[^/]+(|\/[^/]+)$/gi.test(location)) {
      throw new Error(
        "An Azure repository must be specified in the format 'organisation/project', or 'organisation/project/repo'.",
      );
    }

    const components = trim(location, '/').split('/', 3);
    this.org = components[0];
    this.project = components[1];
    this.name = components[2] || components[1];
  }
}

interface AzureUser {
  id: string;
  displayName: string;
  emailAddress: string;
}

interface AzureCommitAuthor {
  name: string;
  email: string;
}
// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-5.1#gititem
interface AzureGitItem {
  // this is the response we see in Azure, but it is just documented as "Object[]" so it is inconsistent
  _links: {
    tree: {
      href: string;
    };
  };
  commitId: string;
  isFolder: boolean;
  isSymLink: boolean;
}

interface AzureGitTreeRef {
  _links: AzureReferenceLinks[];
  url: string;
  href: string;
  treeEntries?: AzureGitTreeEntryRef[];
}

interface AzureReferenceLinks {
  links: object[];
  tree?: AzureGitTreeRef;
}

export interface AzureGitTreeEntryRef {
  gitObjectType: string;
  objectId: string;
  relativePath: string;
  size: number;
  url: string;
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull%20requests/get%20pull%20request?view=azure-devops-rest-5.1#gitpullrequest
interface AzureWebApiTagDefinition {
  active: boolean;
  id: string;
  name: string;
  url: string;
}

interface AzurePullRequest {
  title: string;
  artifactId: string;
  closedDate: string;
  isDraft: string;
  status: AzurePullRequestStatus;
  lastMergeSourceCommit: AzureGitChangeItem;
  mergeStatus: AzureAsyncPullRequestStatus;
  pullRequestId: number;
  labels: AzureWebApiTagDefinition[];
  sourceRefName: string;
}

type AzurePullRequestStatusItem = {
  status: AzurePullRequestStatus;
  name: string;
  target_url: string;
};

// This does not match Azure documentation, but it is what comes back from some calls
// PullRequest as an example is documented as returning PullRequest[], but it actually
// returns that inside of this value prop in the json
interface AzureArray<T> {
  value: T[];
}

enum AzureCommitChangeType {
  ADD = 'add',
  DELETE = 'delete',
  RENAME = 'rename',
  EDIT = 'edit',
}

enum AzureItemContentType {
  RAW = 'rawtext',
  BASE64 = 'base64encoded',
}

enum AzurePullRequestStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

enum AzureAsyncPullRequestStatus {
  CONFLICTS = 'conflicts',
  FAILURE = 'failure',
  QUEUED = 'queued',
  REJECTED = 'rejectedByPolicy',
  SUCCEEDED = 'succeeded',
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-5.1#gitcommitdiffs
interface AzureGitCommitDiffs {
  changes: AzureGitChange[];
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-5.1#gitchange
interface AzureGitChange {
  changeId: number;
  item: AzureGitChangeItem; // string
  changeType: AzureCommitChangeType;
  originalPath: string;
  url: string;
}

interface AzureGitChangeItem {
  objectId: string;
  originalObjectId: string;
  gitObjectType: string;
  commitId: string;
  path: string;
  isFolder: string;
  url: string;
}

type AzureRefUpdate = {
  name: string;
  oldObjectId: string;
};

class AzureRef {
  name: string;
  objectId: string;

  constructor(name: string, objectId: string) {
    this.name = name;
    this.objectId = objectId;
  }
}

class AzureItemContent {
  content: string;
  contentType: AzureItemContentType;

  constructor(content: string, type: AzureItemContentType) {
    this.content = content;
    this.contentType = type;
  }
}

class AzureCommitChangeItem {
  path: string;

  constructor(path: string) {
    this.path = path;
  }
}

class AzureCommitChange {
  changeType: AzureCommitChangeType;
  item: AzureCommitChangeItem;

  constructor(changeType: AzureCommitChangeType, path: string) {
    this.changeType = changeType;
    this.item = new AzureCommitChangeItem(path);
  }
}

class AzureCommitAddChange extends AzureCommitChange {
  newContent: AzureItemContent;

  constructor(path: string, content: string, type: AzureItemContentType) {
    super(AzureCommitChangeType.ADD, path);
    this.newContent = new AzureItemContent(content, type);
  }
}

class AzureCommitEditChange extends AzureCommitChange {
  newContent: AzureItemContent;

  constructor(path: string, content: string, type: AzureItemContentType) {
    super(AzureCommitChangeType.EDIT, path);
    this.newContent = new AzureItemContent(content, type);
  }
}

class AzureCommitRenameChange extends AzureCommitChange {
  sourceServerItem: string;

  constructor(source: string, destination: string) {
    super(AzureCommitChangeType.RENAME, destination);
    this.sourceServerItem = source;
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Change list provides an easy way to create a range of different changes on a single
 * commit. Rename serves as move.
 */
class AzureChangeList extends Array<AzureCommitChange> {
  constructor() {
    super();
  }

  addBase64(path: string, base64data: string) {
    this.push(new AzureCommitAddChange(path, base64data, AzureItemContentType.BASE64));
  }

  addRawText(path: string, text: string) {
    this.push(new AzureCommitAddChange(path, text, AzureItemContentType.RAW));
  }

  delete(path: string) {
    this.push(new AzureCommitChange(AzureCommitChangeType.DELETE, path));
  }

  editBase64(path: string, base64data: string) {
    this.push(new AzureCommitEditChange(path, base64data, AzureItemContentType.BASE64));
  }

  rename(source: string, destination: string) {
    this.push(new AzureCommitRenameChange(source, destination));
  }
}

type AzureCommitItem = {
  action: AzureCommitChangeType;
  base64Content: string;
  path: string;
};

class AzureCommit {
  comment: string;
  changes: AzureChangeList;

  constructor(comment = 'Default commit comment') {
    this.comment = comment;
    this.changes = new AzureChangeList();
  }
}

class AzurePush {
  refUpdates: AzureRefUpdate[];
  commits: AzureCommit[];

  constructor(ref: AzureRef) {
    this.refUpdates = [{ name: ref.name, oldObjectId: ref.objectId }];
    this.commits = [];
  }
}

class AzurePRLabel {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export interface AzureApiConfig {
  apiRoot: string;
  repo: AzureRepo;
  branch: string;
  path: string;
  squashMerges: boolean;
  initialWorkflowStatus: string;
}

export default class API {
  apiRoot: string;
  apiVersion: string;
  token?: string;
  branch: string;
  squashMerges: boolean;
  repo: AzureRepo;
  endpointUrl: string;
  initialWorkflowStatus: string;
  commitAuthor?: AzureCommitAuthor;
  cmsLabelPrefix: string;

  constructor(config: AzureApiConfig, token: string) {
    this.repo = config.repo;
    this.apiRoot = trim(config.apiRoot, '/') || 'https://dev.azure.com';
    this.endpointUrl = `${this.apiRoot}/${this.repo?.org}/${this.repo?.project}/_apis/git/repositories/${this.repo?.name}`;
    this.token = token || undefined;
    this.branch = config.branch || 'master';
    this.squashMerges = config.squashMerges || true;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.apiVersion = '5.1'; // Azure API version is recommended and sometimes even required
    this.cmsLabelPrefix = CMS_BRANCH_PREFIX ? CMS_BRANCH_PREFIX : DEFAULT_NETLIFY_CMS_LABEL_PREFIX;
  }

  withAuthorizationHeaders = (req: ApiRequest) =>
    unsentRequest.withHeaders(this.token ? { Authorization: `Bearer ${this.token}` } : {}, req);

  withAzureFeatures = (req: ApiRequest) => {
    req = unsentRequest.withHeaders(
      {
        'Content-Type': 'application/json; charset=utf-8',
        Origin: '*',
      },
      req,
    );

    req = unsentRequest.withParams(
      {
        'api-version': this.apiVersion + '-preview',
      },
      req,
    );

    return req;
  };

  buildRequest = (req: ApiRequest) =>
    flow([
      unsentRequest.withRoot(this.apiRoot),
      this.withAuthorizationHeaders,
      this.withAzureFeatures,
      // unsentRequest.withTimestamp,
    ])(req);

  request = async (req: ApiRequest): Promise<Response> =>
    flow([
      this.buildRequest,
      unsentRequest.performRequest,
      p => p.catch((err: Error) => Promise.reject(new APIError(err.message, null, API_NAME))),
    ])(req);

  responseToJSON = responseParser({ format: 'json', apiName: API_NAME });
  responseToBlob = responseParser({ format: 'blob', apiName: API_NAME });
  responseToText = responseParser({ format: 'text', apiName: API_NAME });

  requestJSON = <T>(req: ApiRequest) => this.request(req).then(this.responseToJSON) as Promise<T>;
  requestText = (req: ApiRequest) => this.request(req).then(this.responseToText) as Promise<string>;

  toBase64 = (str: string) => Promise.resolve(Base64.encode(str));
  fromBase64 = (str: string) => Base64.decode(str);

  branchToRef = (branch: string): string => `refs/heads/${branch}`;
  refToBranch = (ref: string): string => ref.substr(11);

  /**
   * Get the name of the current user by hitting the VS /me endpoint to
   * return an AzureUser object.
   */
  user = (): Promise<AzureUser> => {
    return this.requestJSON({
      url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me',
    }) as Promise<AzureUser>;
  };

  async retrieveMetadata(contentKey: string) {
    const { collection, slug } = parseContentKey(contentKey);
    const branch = this.branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchPullRequest(branch);

    const diff = await this.getDifferences(mergeRequest.sourceRefName);
    const path1 = diff.find(d => d.item.path.includes(slug));
    const path = path1?.item.path as string;
    const mediaFiles = diff
      .filter(d => !d.item.isFolder)
      .map(d => {
        const path = d.item.path;
        const id = d.item.objectId;
        return { path, id };
      });

    const prLabel = mergeRequest.labels?.find((l: AzurePRLabel) =>
      isCMSLabel(l.name, DEFAULT_NETLIFY_CMS_LABEL_PREFIX),
    );
    const labelText = prLabel
      ? prLabel.name
      : statusToLabel('draft', DEFAULT_NETLIFY_CMS_LABEL_PREFIX);
    const status = labelToStatus(labelText, DEFAULT_NETLIFY_CMS_LABEL_PREFIX);

    return { branch, collection, slug, path, status, mediaFiles };
  }

  async readFileMetadata(
    path: string,
    sha: string | null | undefined,
    { branch = this.branch } = {},
  ) {
    const fetchFileMetadata = async () => {
      try {
        const result = await this.request({
          url: `${this.endpointUrl}/commits/`,
          params: { 'searchCriteria.itemPath': path, 'searchCriteria.itemVersion.version': branch },
          cache: 'no-store',
        });

        const commit = (await this.responseToJSON(result))['value'][0];

        return {
          author: commit.author.email || commit.author.name,
          updatedOn: commit.author.date,
        };
      } catch (error) {
        return { author: '', updatedOn: '' };
      }
    };

    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  /**
   * Reads a single file from an Azure DevOps Git repository, using the 'items' endpoint,
   * with the path to the desired file. Parses the response whether it's a string or blob,
   * and then passes the retrieval function to the central readFile cache.
   * @param path The repo-relative path of the file to read.
   * @param sha  Null. Not used by the Azure implementation.
   * @param opts Override options.
   */
  readFile = async (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch } = {},
  ): Promise<string | Blob> => {
    const fetchContent = async () => {
      return await this.request({
        url: `${this.endpointUrl}/items/`,
        params: { version: branch, path },
        cache: 'no-store',
      }).then<Blob | string>(parseText ? this.responseToText : this.responseToBlob);
    };

    return await readFile(sha, fetchContent, localForage, parseText);
  };

  listFiles = async (path: string, recursive = false) => {
    try {
      let azureGitItemParams = {};

      if (recursive) {
        azureGitItemParams = {
          version: this.branch,
          scopePath: path,
          recursionLevel: 'full',
        };
      } else {
        azureGitItemParams = {
          version: this.branch,
          path,
          recursionLevel: 'none',
        };
      }

      const azureGitItem = await this.requestJSON<AzureGitItem>({
        url: `${this.endpointUrl}/items/`,
        params: azureGitItemParams, // Azure
      });

      const azureGitTreeRef = await this.requestJSON<AzureGitTreeRef>(
        azureGitItem._links.tree.href,
      );

      const azureTreeEntries = azureGitTreeRef.treeEntries || [];
      if (!Array.isArray(azureTreeEntries)) {
        throw new Error(
          `Cannot list files, path ${path} is not a directory but a ${typeof azureTreeEntries}`,
        );
      }

      const processedAzureTreeEntries: AzureGitTreeEntryRef[] = [];

      for (const f of azureTreeEntries) {
        f.relativePath = `${path}/${f.relativePath}`;
        let entry: AzureGitTreeEntryRef | undefined = f;
        // If AzureGitTreeEntryRef is still a tree object, we need to drill further to get to the blob
        if (f.gitObjectType === 'tree') {
          const azureGitNestedTreeRef = await this.requestJSON<AzureGitTreeRef>(f.url);

          entry = azureGitNestedTreeRef.treeEntries
            ? azureGitNestedTreeRef.treeEntries[0]
            : undefined;

          if (entry) {
            entry.relativePath = `${f.relativePath}/${entry.relativePath}`;
          }
        }
        if (entry) {
          processedAzureTreeEntries.push(entry);
        }
      }

      return processedAzureTreeEntries;
      // return azureTreeEntries.filter(
      //   file => file.gitObjectType === 'blob' || file.gitObjectType === 'tree',
      // ); // Azure
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Gets an AzureRef representing the HEAD commit of the specified branch.
   * @param branch The name of the branch to get a commit ref for.
   */
  async getRef(branch: string = this.branch): Promise<AzureRef> {
    const refs: { value: AzureRef[] } = await this.requestJSON({
      url: `${this.endpointUrl}/refs`,
      params: {
        $top: '1', // There's only one, so keep the payload small
        filter: 'heads/' + branch,
      },
    });

    return first(
      refs.value.filter((b: AzureRef) => b.name == this.branchToRef(branch)),
    ) as AzureRef;
  }

  async deleteRef(ref: AzureRef): Promise<void> {
    const deleteBranchPayload = [
      {
        name: ref.name,
        oldObjectId: ref.objectId,
        newObjectId: '0000000000000000000000000000000000000000',
      },
    ];

    await this.requestJSON({
      method: 'POST',
      url: `${this.endpointUrl}/refs`,
      body: JSON.stringify(deleteBranchPayload),
    });
  }

  uploadAndCommit(
    items: AzureCommitItem[],
    comment = 'Creating new files',
    branch: string = this.branch,
    newBranch = false,
  ) {
    return this.getRef(branch).then(async (ref: AzureRef) => {
      if (ref == null) {
        ref = await this.getRef(this.branch);
      }

      if (newBranch) {
        ref = new AzureRef(this.branchToRef(branch), ref.objectId);
      }

      const commit = new AzureCommit(comment);

      items.forEach((i: AzureCommitItem) => {
        switch (i.action as AzureCommitChangeType) {
          case AzureCommitChangeType.ADD:
            commit.changes.addBase64(i.path, i.base64Content);
            break;
          case AzureCommitChangeType.EDIT:
            commit.changes.editBase64(i.path, i.base64Content);
            break;
          case AzureCommitChangeType.DELETE:
            commit.changes.delete(i.path);
            break;
          case AzureCommitChangeType.RENAME:
            commit.changes.rename(i.path, i.path);
            break;
        }
      });

      // Only bother with a request if we're going to make changes.
      if (commit.changes.length > 0) {
        const push = new AzurePush(ref);
        push.commits.push(commit);

        return this.requestJSON({
          url: `${this.endpointUrl}/pushes`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(push),
        });
      }
    });
  }

  async readUnpublishedBranchFile(contentKey: string) {
    const { branch, collection, slug, path, status, mediaFiles } = await this.retrieveMetadata(
      contentKey,
    );
    const [fileData, isModification] = await Promise.all([
      this.readFile(path, null, { branch }) as Promise<string>,
      this.isFileExists(path, this.branch),
    ]);

    return {
      slug,
      metaData: { branch, collection, objects: { entry: { path, mediaFiles } }, status },
      fileData,
      isModification,
    };
  }

  async retrieveUnpublishedEntryData(contentKey: string) {
    const { collection, slug } = parseContentKey(contentKey);
    const branch = this.branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const diffs = await this.getDifferences(pullRequest.sourceRefName);
    const diffsWithIds = await Promise.all(
      diffs.map(async d => {
        const path = d.item.path;
        const newFile = d.changeType === 'add';
        const id = d.item.objectId;
        return { id, path, newFile };
      }),
    );
    const label = pullRequest.labels.find(l => isCMSLabel(l.name, this.cmsLabelPrefix));
    const labelName = label && label.name ? label.name : DEFAULT_NETLIFY_CMS_LABEL_PREFIX;
    const status = labelToStatus(labelName, this.cmsLabelPrefix);
    const updatedAt = pullRequest.closedDate;
    return {
      collection,
      slug,
      status,
      diffs: diffsWithIds,
      updatedAt,
    };
  }

  isUnpublishedEntryModification(path: string, branch: string) {
    return this.readFile(path, null, { branch })
      .then(() => true)
      .catch((err: Error) => {
        if (err.message && err.message === 'Not Found') {
          return false;
        }
        throw err;
      });
  }

  /**
   * Retrieve statuses for a given SHA. Unrelated to the editorial workflow
   * concept of entry "status". Useful for things like deploy preview links.
   */
  // async getStatuses(collection: string, slug: string) {
  async getStatuses(collection: string, slug: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = this.branchFromContentKey(contentKey);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.getBranchPullRequest(branch);

    const statuses: AzurePullRequestStatusItem[] = [];
    // eslint-disable-next-line @typescript-eslint/camelcase
    return statuses.map(({ name, status, target_url }) => ({
      context: name,
      state: status ? PreviewState.Success : PreviewState.Other,
      // eslint-disable-next-line @typescript-eslint/camelcase
      target_url,
    }));
  }

  async getCommitItems(files: { path: string; newPath?: string }[], branch: string) {
    const items = await Promise.all(
      files.map(async file => {
        const [base64Content, fileExists] = await Promise.all([
          result(file, 'toBase64', partial(this.toBase64, (file as DataFile).raw)),
          this.isFileExists(file.path, branch),
        ]);

        return {
          action: fileExists ? AzureCommitChangeType.EDIT : AzureCommitChangeType.ADD,
          base64Content,
          path: trimStart(file.path, '/'),
        };
      }),
    );
    return items as AzureCommitItem[];
  }

  /**
   * Store a resource in the target repository.
   * @param entry
   * @param mediaFiles
   * @param options
   */
  async persistFiles(dataFiles: DataFile[], mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = [...dataFiles, ...mediaFiles];
    if (options.useWorkflow) {
      const slug = dataFiles[0].slug;
      return this.editorialWorkflowGit(files, slug, options);
    } else {
      const items = await this.getCommitItems(files, this.branch);
      return this.uploadAndCommit(items, options.commitMessage);
    }
  }

  deleteFile(path: string, comment: string, branch = this.branch) {
    return this.getRef(branch).then((ref: AzureRef) => {
      const commit = new AzureCommit(comment);
      commit.changes.delete(path);

      const push = new AzurePush(ref);
      push.commits.push(commit);

      return this.requestJSON({
        url: `${this.endpointUrl}/pushes`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(push),
      });
    });
  }

  contentKeyFromBranch(branch: string) {
    return branch.substring(`${CMS_BRANCH_PREFIX}/`.length);
  }

  branchFromContentKey(contentKey: string) {
    return `${CMS_BRANCH_PREFIX}/${contentKey}`;
  }

  async getPullRequests(sourceBranch?: string): Promise<AzurePullRequest[]> {
    const pullRequests = await this.requestJSON<AzureArray<AzurePullRequest>>({
      url: `${this.endpointUrl}/pullrequests`,
      params: {
        'searchCriteria.status': 'active',
        // eslint-disable-next-line @typescript-eslint/camelcase
        'searchCriteria.targetRefName': this.branchToRef(this.branch),
        'searchCriteria.includeLinks': false,
        // eslint-disable-next-line @typescript-eslint/camelcase
        ...(sourceBranch ? { 'searchCriteria.sourceRefName': this.branchToRef(sourceBranch) } : {}),
      },
    });

    return pullRequests.value.filter(pr =>
      pr.sourceRefName.startsWith(this.branchToRef(CMS_BRANCH_PREFIX)),
    );
  }

  /**
   * Gets a list of all unpublished branches, which is a list of the pending
   * merge requests projected to just their source branch names.
   */
  async listUnpublishedBranches(): Promise<string[]> {
    const pullRequests = await this.getPullRequests();
    const branches = pullRequests.map(pr => this.refToBranch(pr.sourceRefName));
    return branches;
  }

  async isFileExists(path: string, branch: string) {
    return await this.requestText({
      url: `${this.endpointUrl}/items/`,
      params: { version: branch, path },
      cache: 'no-store',
    })
      .then(() => {
        return true;
      })
      .catch(error => {
        if (error instanceof APIError && error.status === 404) {
          return false;
        }
        throw error;
      });
  }

  /**
   * Creates a new pull request with a label of "draft", based on the target branch.
   * See documentation at: https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull%20requests/create?view=azure-devops-rest-5.1
   * @param branch The branch to create the pull request from.
   * @param commitMessage A message to use as the title for the pull request.
   * @param status The status of the pull request.
   */
  async createPullRequest(branch: string, commitMessage: string, status: string) {
    const pr = {
      sourceRefName: this.branchToRef(branch),
      targetRefName: this.branchToRef(this.branch),
      title: commitMessage,
      description: DEFAULT_PR_BODY,
      labels: [
        {
          name: statusToLabel(status, DEFAULT_NETLIFY_CMS_LABEL_PREFIX),
        },
      ],
    };

    await this.requestJSON({
      method: 'POST',
      url: `${this.endpointUrl}/pullrequests`,
      params: {
        supportsIterations: false,
      },
      body: JSON.stringify(pr),
    });
  }

  async getBranchPullRequest(branch: string): Promise<AzurePullRequest> {
    const pullRequests = await this.getPullRequests(branch);

    if (pullRequests.length <= 0) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }

    return pullRequests[0];
  }

  async getDifferences(to: string): Promise<AzureGitChange[]> {
    const result: AzureGitCommitDiffs = await this.requestJSON({
      url: `${this.endpointUrl}/diffs/commits`,
      params: {
        baseVersion: this.branch,
        targetVersion: this.refToBranch(to),
      },
    });

    return result.changes;
  }

  async editorialWorkflowGit(
    files: (DataFile | AssetProxy)[],
    slug: string,
    options: PersistOptions,
  ) {
    // assumes entry.dataFiles share the same slug
    const contentKey = generateContentKey(options.collectionName as string, slug);
    const branch = this.branchFromContentKey(contentKey);
    const unpublished = options.unpublished || false;

    if (!unpublished) {
      const items = await this.getCommitItems(files, this.branch);
      await this.uploadAndCommit(items, options.commitMessage, branch, true);

      await this.createPullRequest(
        branch,
        options.commitMessage,
        options.status || this.initialWorkflowStatus,
      );
    } else {
      const items = await this.getCommitItems(files, branch);
      await this.uploadAndCommit(items, options.commitMessage, branch, true);
    }
  }

  /**
   * Gets a pull request and updates labels to allow it to move between different
   * states in the editorial workflow.
   * @param collection The Jekyll collection the item is in.
   * @param slug The slug for the content item.
   * @param newStatus The new status for the item.
   */
  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = this.branchFromContentKey(contentKey);

    const mergeRequest = await this.getBranchPullRequest(branch);

    const labels = [
      ...mergeRequest.labels
        .filter((label: AzurePRLabel) => !isCMSLabel(label.name, DEFAULT_NETLIFY_CMS_LABEL_PREFIX))
        .map((label: AzurePRLabel) => label.name),
      statusToLabel(newStatus, DEFAULT_NETLIFY_CMS_LABEL_PREFIX),
    ];

    await this.updatePullRequestLabels(mergeRequest, labels);
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchPullRequest(branch);
    await this.abandonPullRequest(mergeRequest);
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchPullRequest(branch);
    await this.completePullRequest(mergeRequest);
  }

  async updatePullRequestLabels(pullRequest: AzurePullRequest, labels: string[]) {
    for (const l of pullRequest.labels) {
      if (isCMSLabel(l.name, DEFAULT_NETLIFY_CMS_LABEL_PREFIX)) {
        await this.requestText({
          method: 'DELETE',
          url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
            pullRequest.pullRequestId,
          )}/labels/${encodeURIComponent(l.id)}`,
          params: {
            'api-version': '5.1-preview.1',
          },
        });
      }
    }

    for (const l of labels) {
      await this.requestText({
        method: 'POST',
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
          pullRequest.pullRequestId,
        )}/labels`,
        params: {
          'api-version': '5.1-preview',
        },
        body: JSON.stringify({ name: l }),
      });
    }
  }

  /**
   * Completes the pull request, setting an appropriate merge commit message
   * and ensuring that the source branch is also deleted.
   * @param pullRequest The merge request provided by a previous GET operation.
   */
  async completePullRequest(pullRequest: AzurePullRequest) {
    // This is the minimum payload required to complete the pull request.
    const pullRequestCompletion = {
      status: AzurePullRequestStatus.COMPLETED,
      lastMergeSourceCommit: pullRequest.lastMergeSourceCommit,
      completionOptions: {
        deleteSourceBranch: true,
        mergeCommitMessage: `Completed merge of ${pullRequest.title}`,
        mergeStrategy: this.squashMerges ? 'squash' : 'noFastForward',
      },
    };

    let response = await this.requestJSON<AzurePullRequest>({
      method: 'PATCH',
      url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      body: JSON.stringify(pullRequestCompletion),
    });

    // We need to wait for Azure to complete the pull request to actually complete
    // Sometimes this is instant, but frequently it is 1-3 seconds
    while (response.mergeStatus === 'queued') {
      await delay(500);
      response = await this.requestJSON({
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      });
    }
  }

  /**
   * Abandons the pull request status and ensuring that the source branch is also deleted.
   * @param pullRequest The pull request provided by a previous GET operation.
   */
  async abandonPullRequest(pullRequest: AzurePullRequest) {
    const pullRequestAbandon = {
      status: AzurePullRequestStatus.ABANDONED,
    };

    await this.requestJSON({
      method: 'PATCH',
      url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      body: JSON.stringify(pullRequestAbandon),
    });

    // Also delete the source branch.
    await this.deleteRef(
      new AzureRef(pullRequest.sourceRefName, pullRequest.lastMergeSourceCommit.commitId),
    );
  }
}
