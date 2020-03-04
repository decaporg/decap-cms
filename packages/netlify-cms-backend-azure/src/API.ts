import { Base64 } from 'js-base64';
import { first, flow, partial, result, trim } from 'lodash';
import {
  localForage,
  APIError,
  ApiRequest,
  unsentRequest,
  responseParser,
  Entry,
  AssetProxy,
  PersistOptions,
  readFile,
  CMS_BRANCH_PREFIX,
  DEFAULT_PR_BODY,
  generateContentKey,
  parseContentKey,
  labelToStatus,
  isCMSLabel,
  EditorialWorkflowError,
  statusToLabel,
  PreviewState,
} from 'netlify-cms-lib-util';

export const API_NAME = 'Azure DevOps';

export class AzureRepo {
  org: string;
  project: string;
  name: string;

  constructor(location?: string | null) {
    if (!location) {
      throw new Error(
        "An Azure repository must be specified in the format 'organisation/project/repo'.",
      );
    }

    const components = trim(location, '/').split('/', 3);
    this.org = components[0];
    this.project = components[1];
    this.name = components[2] || components[1];
  }
}

export interface AzureUser {
  id: string;
  displayName: string;
  emailAddress: string;
}

export interface AzureCommitAuthor {
  name: string;
  email: string;
}
// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-5.1#gititem
export interface AzureGitItem {
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

export interface AzureGitTreeRef {
  _links: AzureReferenceLinks[];
  url: string;
  href: string;
  treeEntries?: AzureGitTreeEntryRef[];
}

export interface AzureReferenceLinks {
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
export interface AzureWebApiTagDefinition {
  active: boolean;
  id: string;
  name: string;
  url: string;
}

export interface AzurePullRequest {
  title: string;
  artifactId: string;
  closedDate: string;
  isDraft: string;
  status: AzurePullRequestStatus;
  mergeStatus: AzureAsyncPullRequestStatus;
  pullRequestId: number;
  labels: AzureWebApiTagDefinition[];
  sourceRefName: string;
}

// This does not match Azure documentation, but it is what comes back from some calls
// PullRequest as an example is documented as returning PullRequest[], but it actually
// returns that inside of this value prop in the json
export interface AzureArray<T> {
  value: T[];
}

enum AzureCommitChangeType {
  ADD = 'add',
  DELETE = 'delete',
  RENAME = 'rename',
  EDIT = 'edit',
}

enum AzureCommitContentType {
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
export interface AzureGitCommitDiffs {
  changes: AzureGitChange[];
}

export interface AzureGitChange {
  item: AzureGitChangeItem;
}

export interface AzureGitChangeItem {
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

class AzureChangeContent {
  content: string;
  contentType: AzureCommitContentType;

  constructor(content: string, type: AzureCommitContentType) {
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
  newContent: AzureChangeContent;

  constructor(path: string, content: string, type: AzureCommitContentType) {
    super(AzureCommitChangeType.ADD, path);
    this.newContent = new AzureChangeContent(content, type);
  }
}

class AzureCommitEditChange extends AzureCommitChange {
  newContent: AzureChangeContent;

  constructor(path: string, content: string, type: AzureCommitContentType) {
    super(AzureCommitChangeType.EDIT, path);
    this.newContent = new AzureChangeContent(content, type);
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
    this.push(new AzureCommitAddChange(path, base64data, AzureCommitContentType.BASE64));
  }

  addRawText(path: string, text: string) {
    this.push(new AzureCommitAddChange(path, text, AzureCommitContentType.RAW));
  }

  delete(path: string) {
    this.push(new AzureCommitChange(AzureCommitChangeType.DELETE, path));
  }

  editBase64(path: string, base64data: string) {
    this.push(new AzureCommitEditChange(path, base64data, AzureCommitContentType.BASE64));
  }

  rename(source: string, destination: string) {
    this.push(new AzureCommitRenameChange(source, destination));
  }
}

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

  constructor(config: AzureApiConfig, token: string) {
    this.repo = config.repo;
    this.apiRoot = trim(config.apiRoot, '/') || 'https://dev.azure.com';
    this.endpointUrl = `${this.apiRoot}/${this.repo?.org}/${this.repo?.project}/_apis/git/repositories/${this.repo?.name}`;
    this.token = token || undefined;
    this.branch = config.branch || 'master';
    this.squashMerges = config.squashMerges || true;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.apiVersion = '5.1'; // Azure API version is recommended and sometimes even required
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

    req = unsentRequest.withDefaultParams(
      {
        'api-version': this.apiVersion,
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
      unsentRequest.withTimestamp,
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
    const mergeRequest = await this.getBranchMergeRequest(branch);

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

    const prLabel = mergeRequest.labels?.find((l: AzurePRLabel) => isCMSLabel(l.name));
    const labelText = prLabel ? prLabel.name : statusToLabel('draft');
    const status = labelToStatus(labelText);

    return { branch, collection, slug, path, status, mediaFiles };
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
    return await this.requestJSON<AzureGitItem>({
      url: `${this.endpointUrl}/items/`,
      params: {
        version: this.branch,
        path,
        recursionLevel: recursive ? 'full' : 'none',
      }, // Azure
    })
      .then(response => {
        // Get the real URL of the tree data and hit it.
        return response._links.tree.href;
      })
      .then(url => {
        return this.requestJSON<AzureGitTreeRef>(url);
      })
      .then(response => {
        const files = response.treeEntries || [];
        if (!Array.isArray(files)) {
          throw new Error(
            `Cannot list files, path ${path} is not a directory but a ${typeof files}`,
          );
        }
        files.forEach((f: any) => {
          f.relativePath = `${path}/${f.relativePath}`;
        });
        return files;
      })
      .then(files => files.filter(file => file.gitObjectType === 'blob')); // Azure
  };

  /**
   * Gets an AzureRef representing the HEAD commit of the specified branch.
   * @param branch The name of the branch to get a commit ref for.
   */
  async getRef(branch: string = this.branch): Promise<AzureRef> {
    return this.requestJSON({
      url: `${this.endpointUrl}/refs`,
      params: {
        $top: '1', // There's only one, so keep the payload small
        filter: 'heads/' + branch,
      },
    }).then((refs: any) => {
      return first(refs.value.filter((b: any) => b.name == this.branchToRef(branch))) as AzureRef;
    });
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
    items: any,
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

      console.log(JSON.stringify(ref));
      const commit = new AzureCommit(comment);

      items.forEach((i: any) => {
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
    await this.getBranchMergeRequest(branch);

    const statuses: any[] = [];
    // eslint-disable-next-line @typescript-eslint/camelcase
    return statuses.map(({ name, status, target_url }) => ({
      context: name,
      state: status ? PreviewState.Success : PreviewState.Other,
      // eslint-disable-next-line @typescript-eslint/camelcase
      target_url,
    }));
  }

  async getCommitItems(files: (Entry | AssetProxy)[], branch: string) {
    const items = await Promise.all(
      files.map(async file => {
        const [base64Content, fileExists] = await Promise.all([
          result(file, 'toBase64', partial(this.toBase64, (file as Entry).raw)),
          this.isFileExists(file.path, branch),
        ]);
        return {
          action: fileExists ? AzureCommitChangeType.EDIT : AzureCommitChangeType.ADD,
          base64Content,
          path: '/' + trim(file.path, '/'),
        };
      }),
    );
    return items as any[];
  }

  /**
   * Store a resource in the target repository.
   * @param entry
   * @param mediaFiles
   * @param options
   */
  async persistFiles(entry: Entry | null, mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = entry ? [entry, ...mediaFiles] : mediaFiles;
    if (options.useWorkflow) {
      return this.editorialWorkflowGit(files, entry as Entry, options);
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

  async getMergeRequests(sourceBranch?: string): Promise<AzurePullRequest[]> {
    const mergeRequests = await this.requestJSON<AzureArray<AzurePullRequest>>({
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

    console.log('MERGE REQUETS', mergeRequests);
    return mergeRequests.value.filter((mr: any) =>
      mr.sourceRefName.startsWith(this.branchToRef(CMS_BRANCH_PREFIX)),
    );
  }

  /**
   * Gets a list of all unpublished branches, which is a list of the pending
   * merge requests projected to just their source branch names.
   */
  async listUnpublishedBranches(): Promise<string[]> {
    const mergeRequests = await this.getMergeRequests();
    const branches = mergeRequests.map((mr: any) => this.refToBranch(mr.sourceRefName));
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
          name: statusToLabel(status),
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

  async getBranchMergeRequest(branch: string): Promise<AzurePullRequest> {
    const mergeRequests = await this.getMergeRequests(branch);
    if (mergeRequests.length <= 0) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }

    return mergeRequests[0];
  }

  async getDifferences(to: string): Promise<AzureGitChange[]> {
    const result: AzureGitCommitDiffs = await this.requestJSON({
      url: `${this.endpointUrl}/diffs/commits`,
      params: {
        baseVersion: this.branch,
        targetVersion: this.refToBranch(to),
      },
    });

    console.log('HERE ARE THE GIT DIFFS', result);
    return result.changes;
  }

  async editorialWorkflowGit(files: (Entry | AssetProxy)[], entry: Entry, options: PersistOptions) {
    const contentKey = generateContentKey(options.collectionName as string, entry.slug);
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

    const mergeRequest = await this.getBranchMergeRequest(branch);

    const labels = [
      ...mergeRequest.labels
        .filter((label: AzurePRLabel) => !isCMSLabel(label.name))
        .map((label: AzurePRLabel) => label.name),
      statusToLabel(newStatus),
    ];

    await this.updatePullRequestLabels(mergeRequest, labels);
  }

  async deleteUnpublishedEntry(collectionName: any, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchMergeRequest(branch);
    await this.abandonPullRequest(mergeRequest);
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchMergeRequest(branch);
    await this.completePullRequest(mergeRequest);
  }

  async updatePullRequestLabels(mergeRequest: any, labels: string[]) {
    mergeRequest.labels.forEach(async (l: AzurePRLabel) => {
      if (isCMSLabel(l.name)) {
        await this.requestText({
          method: 'DELETE',
          url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
            mergeRequest.pullRequestId,
          )}/labels/${encodeURIComponent(l.id)}`,
          params: {
            'api-version': '5.1-preview.1',
          },
        });
      }
    });

    labels.forEach(async (l: string) => {
      await this.requestText({
        method: 'POST',
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
          mergeRequest.pullRequestId,
        )}/labels`,
        params: {
          'api-version': '5.1-preview',
        },
        body: JSON.stringify({ name: l }),
      });
    });
  }

  /**
   * Completes the pull request, setting an appropriate merge commit message
   * and ensuring that the source branch is also deleted.
   * @param mergeRequest The merge request provided by a previous GET operation.
   */
  async completePullRequest(mergeRequest: any) {
    // This is the minimum payload required to complete the pull request.
    const pullRequestCompletion = {
      status: AzurePullRequestStatus.COMPLETED,
      lastMergeSourceCommit: mergeRequest.lastMergeSourceCommit,
      completionOptions: {
        deleteSourceBranch: true,
        mergeCommitMessage: `Completed merge of ${mergeRequest.title}`,
        mergeStrategy: this.squashMerges ? 'squash' : 'noFastForward',
      },
    };

    let response = await this.requestJSON<AzurePullRequest>({
      method: 'PATCH',
      url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(mergeRequest.pullRequestId)}`,
      body: JSON.stringify(pullRequestCompletion),
    });

    // We need to wait for Azure to complete the pull request to actually complete
    // Sometimes this is instant, but frequently it is 1-3 seconds
    while (response.mergeStatus === 'queued') {
      await delay(500);
      response = await this.requestJSON({
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(mergeRequest.pullRequestId)}`,
      });
    }
  }

  /**
   * Abandons the pull request status and ensuring that the source branch is also deleted.
   * @param pullRequest The pull request provided by a previous GET operation.
   */
  async abandonPullRequest(pullRequest: any) {
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
