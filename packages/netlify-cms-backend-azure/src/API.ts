import { Base64 } from 'js-base64';
import { partial, result, trim, trimStart } from 'lodash';
import {
  localForage,
  APIError,
  ApiRequest,
  unsentRequest,
  requestWithBackoff,
  responseParser,
  AssetProxy,
  PersistOptions,
  readFile,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  generateContentKey,
  parseContentKey,
  labelToStatus,
  isCMSLabel,
  EditorialWorkflowError,
  statusToLabel,
  PreviewState,
  readFileMetadata,
  DataFile,
  branchFromContentKey,
} from 'netlify-cms-lib-util';
import { Map } from 'immutable';
import { dirname, basename } from 'path';

export const API_NAME = 'Azure DevOps';

const API_VERSION = 'api-version';

type AzureUser = {
  coreAttributes?: {
    Avatar?: { value?: { value?: string } };
    DisplayName?: { value?: string };
    EmailAddress?: { value?: string };
  };
};

type AzureGitItem = {
  objectId: string;
  gitObjectType: AzureObjectType;
  path: string;
};

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull%20requests/get%20pull%20request?view=azure-devops-rest-6.1#gitpullrequest
type AzureWebApiTagDefinition = {
  active: boolean;
  id: string;
  name: string;
  url: string;
};

type AzurePullRequest = {
  title: string;
  artifactId: string;
  closedDate: string;
  creationDate: string;
  isDraft: string;
  status: AzurePullRequestStatus;
  lastMergeSourceCommit: AzureGitChangeItem;
  mergeStatus: AzureAsyncPullRequestStatus;
  pullRequestId: number;
  labels: AzureWebApiTagDefinition[];
  sourceRefName: string;
};

type AzurePullRequestCommit = { commitId: string };

enum AzureCommitStatusState {
  ERROR = 'error',
  FAILED = 'failed',
  NOT_APPLICABLE = 'notApplicable',
  NOT_SET = 'notSet',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
}

type AzureCommitStatus = {
  context: { genre?: string | null; name: string };
  state: AzureCommitStatusState;
  targetUrl: string;
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

enum AzureObjectType {
  BLOB = 'blob',
  TREE = 'tree',
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-6.1#gitcommitdiffs
interface AzureGitCommitDiffs {
  changes: AzureGitChange[];
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-6.1#gitchange
interface AzureGitChange {
  changeId: number;
  item: AzureGitChangeItem;
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

type AzureRef = {
  name: string;
  objectId: string;
};

type AzureCommit = {
  author: {
    date: string;
    email: string;
    name: string;
  };
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getChangeItem(item: AzureCommitItem) {
  switch (item.action) {
    case AzureCommitChangeType.ADD:
      return {
        changeType: AzureCommitChangeType.ADD,
        item: { path: item.path },
        newContent: {
          content: item.base64Content,
          contentType: AzureItemContentType.BASE64,
        },
      };
    case AzureCommitChangeType.EDIT:
      return {
        changeType: AzureCommitChangeType.EDIT,
        item: { path: item.path },
        newContent: {
          content: item.base64Content,
          contentType: AzureItemContentType.BASE64,
        },
      };
    case AzureCommitChangeType.DELETE:
      return {
        changeType: AzureCommitChangeType.DELETE,
        item: { path: item.path },
      };
    case AzureCommitChangeType.RENAME:
      return {
        changeType: AzureCommitChangeType.RENAME,
        item: { path: item.path },
        sourceServerItem: item.oldPath,
      };
    default:
      return {};
  }
}

type AzureCommitItem = {
  action: AzureCommitChangeType;
  base64Content?: string;
  text?: string;
  path: string;
  oldPath?: string;
};

interface AzureApiConfig {
  apiRoot: string;
  repo: { org: string; project: string; repoName: string };
  branch: string;
  squashMerges: boolean;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;
  apiVersion: string;
}

export default class API {
  apiVersion: string;
  token: string;
  branch: string;
  mergeStrategy: string;
  endpointUrl: string;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;

  constructor(config: AzureApiConfig, token: string) {
    const { repo } = config;
    const apiRoot = trim(config.apiRoot, '/');
    this.endpointUrl = `${apiRoot}/${repo.org}/${repo.project}/_apis/git/repositories/${repo.repoName}`;
    this.token = token;
    this.branch = config.branch;
    this.mergeStrategy = config.squashMerges ? 'squash' : 'noFastForward';
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.apiVersion = config.apiVersion;
    this.cmsLabelPrefix = config.cmsLabelPrefix;
  }

  withHeaders = (req: ApiRequest) => {
    const withHeaders = unsentRequest.withHeaders(
      {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      req,
    );
    return withHeaders;
  };

  withAzureFeatures = (req: Map<string, Map<string, string>>) => {
    if (req.hasIn(['params', API_VERSION])) {
      return req;
    }
    const withParams = unsentRequest.withParams(
      {
        [API_VERSION]: `${this.apiVersion}`,
      },
      req,
    );

    return withParams;
  };

  buildRequest = (req: ApiRequest) => {
    const withHeaders = this.withHeaders(req);
    const withAzureFeatures = this.withAzureFeatures(withHeaders);
    if (withAzureFeatures.has('cache')) {
      return withAzureFeatures;
    } else {
      const withNoCache = unsentRequest.withNoCache(withAzureFeatures);
      return withNoCache;
    }
  };

  request = (req: ApiRequest): Promise<Response> => {
    try {
      return requestWithBackoff(this, req);
    } catch (err) {
      throw new APIError(err.message, null, API_NAME);
    }
  };

  responseToJSON = responseParser({ format: 'json', apiName: API_NAME });
  responseToBlob = responseParser({ format: 'blob', apiName: API_NAME });
  responseToText = responseParser({ format: 'text', apiName: API_NAME });

  requestJSON = <T>(req: ApiRequest) => this.request(req).then(this.responseToJSON) as Promise<T>;
  requestText = (req: ApiRequest) => this.request(req).then(this.responseToText) as Promise<string>;

  toBase64 = (str: string) => Promise.resolve(Base64.encode(str));
  fromBase64 = (str: string) => Base64.decode(str);

  branchToRef = (branch: string): string => `refs/heads/${branch}`;
  refToBranch = (ref: string): string => ref.substr('refs/heads/'.length);

  user = async () => {
    const result = await this.requestJSON<AzureUser>({
      url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me',
      params: { [API_VERSION]: '6.1-preview.2' },
    });

    const name = result.coreAttributes?.DisplayName?.value;
    const email = result.coreAttributes?.EmailAddress?.value;
    const url = result.coreAttributes?.Avatar?.value?.value;
    const user = {
      name: name || email || '',
      // eslint-disable-next-line @typescript-eslint/camelcase
      avatar_url: `data:image/png;base64,${url}`,
      email,
    };
    return user;
  };

  async readFileMetadata(
    path: string,
    sha: string | null | undefined,
    { branch = this.branch } = {},
  ) {
    const fetchFileMetadata = async () => {
      try {
        const { value } = await this.requestJSON<AzureArray<AzureCommit>>({
          url: `${this.endpointUrl}/commits/`,
          params: {
            'searchCriteria.itemPath': path,
            'searchCriteria.itemVersion.version': branch,
            'searchCriteria.$top': 1,
          },
        });
        const [commit] = value;

        return {
          author: commit.author.name || commit.author.email,
          updatedOn: commit.author.date,
        };
      } catch (error) {
        return { author: '', updatedOn: '' };
      }
    };

    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  readFile = (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch } = {},
  ) => {
    const fetchContent = () => {
      return this.request({
        url: `${this.endpointUrl}/items/`,
        params: { version: branch, path },
        cache: 'no-store',
      }).then<Blob | string>(parseText ? this.responseToText : this.responseToBlob);
    };

    return readFile(sha, fetchContent, localForage, parseText);
  };

  listFiles = async (path: string, recursive: boolean, branch = this.branch) => {
    try {
      const { value: items } = await this.requestJSON<AzureArray<AzureGitItem>>({
        url: `${this.endpointUrl}/items/`,
        params: {
          version: branch,
          scopePath: path,
          recursionLevel: recursive ? 'full' : 'oneLevel',
        },
      });

      const files = items
        .filter(item => item.gitObjectType === AzureObjectType.BLOB)
        .map(file => ({
          id: file.objectId,
          path: trimStart(file.path, '/'),
          name: basename(file.path),
        }));
      return files;
    } catch (err) {
      if (err && err.status === 404) {
        console.log('This 404 was expected and handled appropriately.');
        return [];
      } else {
        throw err;
      }
    }
  };

  async getRef(branch: string = this.branch) {
    const { value: refs } = await this.requestJSON<AzureArray<AzureRef>>({
      url: `${this.endpointUrl}/refs`,
      params: {
        $top: '1', // There's only one ref, so keep the payload small
        filter: 'heads/' + branch,
      },
    });

    return refs.find(b => b.name == this.branchToRef(branch))!;
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

  async uploadAndCommit(
    items: AzureCommitItem[],
    comment: string,
    branch: string,
    newBranch: boolean,
  ) {
    const ref = await this.getRef(newBranch ? this.branch : branch);

    const refUpdate = [
      {
        name: this.branchToRef(branch),
        oldObjectId: ref.objectId,
      },
    ];

    const changes = items.map(item => getChangeItem(item));
    const commits = [{ comment, changes }];
    const push = {
      refUpdates: refUpdate,
      commits,
    };

    return this.requestJSON({
      url: `${this.endpointUrl}/pushes`,
      method: 'POST',
      body: JSON.stringify(push),
    });
  }

  async retrieveUnpublishedEntryData(contentKey: string) {
    const { collection, slug } = parseContentKey(contentKey);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const diffs = await this.getDifferences(pullRequest.sourceRefName);
    const diffsWithIds = await Promise.all(
      diffs.map(async d => {
        const path = trimStart(d.item.path, '/');
        const newFile = d.changeType === AzureCommitChangeType.ADD;
        const id = d.item.objectId;
        return { id, path, newFile };
      }),
    );
    const label = pullRequest.labels.find(l => isCMSLabel(l.name, this.cmsLabelPrefix));
    const labelName = label && label.name ? label.name : this.cmsLabelPrefix;
    const status = labelToStatus(labelName, this.cmsLabelPrefix);
    // Uses creationDate, as we do not have direct access to the updated date
    const updatedAt = pullRequest.closedDate ? pullRequest.closedDate : pullRequest.creationDate;
    return {
      collection,
      slug,
      status,
      diffs: diffsWithIds,
      updatedAt,
    };
  }

  async getPullRequestStatues(pullRequest: AzurePullRequest) {
    const { value: commits } = await this.requestJSON<AzureArray<AzurePullRequestCommit>>({
      url: `${this.endpointUrl}/pullrequests/${pullRequest.pullRequestId}/commits`,
      params: {
        $top: 1,
      },
    });
    const { value: statuses } = await this.requestJSON<AzureArray<AzureCommitStatus>>({
      url: `${this.endpointUrl}/commits/${commits[0].commitId}/statuses`,
      params: { latestOnly: true },
    });
    return statuses;
  }

  async getStatuses(collection: string, slug: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const statuses = await this.getPullRequestStatues(pullRequest);
    return statuses.map(({ context, state, targetUrl }) => ({
      context: context.name,
      state: state === AzureCommitStatusState.SUCCEEDED ? PreviewState.Success : PreviewState.Other,
      // eslint-disable-next-line @typescript-eslint/camelcase
      target_url: targetUrl,
    }));
  }

  async getCommitItems(files: { path: string; newPath?: string }[], branch: string) {
    const items = await Promise.all(
      files.map(async file => {
        const [base64Content, fileExists] = await Promise.all([
          result(file, 'toBase64', partial(this.toBase64, (file as DataFile).raw)),
          this.isFileExists(file.path, branch),
        ]);

        const path = file.newPath || file.path;
        const oldPath = file.path;
        const renameOrEdit =
          path !== oldPath ? AzureCommitChangeType.RENAME : AzureCommitChangeType.EDIT;

        const action = fileExists ? renameOrEdit : AzureCommitChangeType.ADD;
        return {
          action,
          base64Content,
          path,
          oldPath,
        } as AzureCommitItem;
      }),
    );

    // move children
    for (const item of items.filter(i => i.oldPath && i.action === AzureCommitChangeType.RENAME)) {
      const sourceDir = dirname(item.oldPath as string);
      const destDir = dirname(item.path);
      const children = await this.listFiles(sourceDir, true, branch);
      children
        .filter(file => file.path !== item.oldPath)
        .forEach(file => {
          items.push({
            action: AzureCommitChangeType.RENAME,
            path: file.path.replace(sourceDir, destDir),
            oldPath: file.path,
          });
        });
    }

    return items;
  }

  async persistFiles(dataFiles: DataFile[], mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = [...dataFiles, ...mediaFiles];
    if (options.useWorkflow) {
      const slug = dataFiles[0].slug;
      return this.editorialWorkflowGit(files, slug, options);
    } else {
      const items = await this.getCommitItems(files, this.branch);

      return this.uploadAndCommit(items, options.commitMessage, this.branch, true);
    }
  }

  async deleteFiles(paths: string[], comment: string) {
    const ref = await this.getRef(this.branch);
    const refUpdate = {
      name: ref.name,
      oldObjectId: ref.objectId,
    };

    const changes = paths.map(path =>
      getChangeItem({ action: AzureCommitChangeType.DELETE, path }),
    );
    const commits = [{ comment, changes }];
    const push = {
      refUpdates: [refUpdate],
      commits,
    };

    return this.requestJSON({
      url: `${this.endpointUrl}/pushes`,
      method: 'POST',
      body: JSON.stringify(push),
    });
  }

  async getPullRequests(sourceBranch?: string) {
    const { value: pullRequests } = await this.requestJSON<AzureArray<AzurePullRequest>>({
      url: `${this.endpointUrl}/pullrequests`,
      params: {
        'searchCriteria.status': 'active',
        'searchCriteria.targetRefName': this.branchToRef(this.branch),
        'searchCriteria.includeLinks': false,
        ...(sourceBranch ? { 'searchCriteria.sourceRefName': this.branchToRef(sourceBranch) } : {}),
      },
    });

    const filtered = pullRequests.filter(pr => {
      return pr.labels.some(label => isCMSLabel(label.name, this.cmsLabelPrefix));
    });
    return filtered;
  }

  async listUnpublishedBranches(): Promise<string[]> {
    const pullRequests = await this.getPullRequests();
    const branches = pullRequests.map(pr => this.refToBranch(pr.sourceRefName));
    return branches;
  }

  async isFileExists(path: string, branch: string) {
    try {
      await this.requestText({
        url: `${this.endpointUrl}/items/`,
        params: { version: branch, path },
        cache: 'no-store',
      });
      return true;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async createPullRequest(branch: string, commitMessage: string, status: string) {
    const pr = {
      sourceRefName: this.branchToRef(branch),
      targetRefName: this.branchToRef(this.branch),
      title: commitMessage,
      description: DEFAULT_PR_BODY,
      labels: [
        {
          name: statusToLabel(status, this.cmsLabelPrefix),
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

  async getBranchPullRequest(branch: string) {
    const pullRequests = await this.getPullRequests(branch);

    if (pullRequests.length <= 0) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }

    return pullRequests[0];
  }

  async getDifferences(to: string) {
    const result = await this.requestJSON<AzureGitCommitDiffs>({
      url: `${this.endpointUrl}/diffs/commits`,
      params: {
        baseVersion: this.branch,
        targetVersion: this.refToBranch(to),
      },
    });

    return result.changes.filter(
      d =>
        d.item.gitObjectType === AzureObjectType.BLOB &&
        Object.values(AzureCommitChangeType).includes(d.changeType),
    );
  }

  async editorialWorkflowGit(
    files: (DataFile | AssetProxy)[],
    slug: string,
    options: PersistOptions,
  ) {
    const contentKey = generateContentKey(options.collectionName as string, slug);
    const branch = branchFromContentKey(contentKey);
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
      await this.uploadAndCommit(items, options.commitMessage, branch, false);
    }
  }

  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);

    const pullRequest = await this.getBranchPullRequest(branch);

    const nonCmsLabels = pullRequest.labels
      .filter(label => !isCMSLabel(label.name, this.cmsLabelPrefix))
      .map(label => label.name);

    const labels = [...nonCmsLabels, statusToLabel(newStatus, this.cmsLabelPrefix)];
    await this.updatePullRequestLabels(pullRequest, labels);
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    await this.abandonPullRequest(pullRequest);
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    await this.completePullRequest(pullRequest);
  }

  async updatePullRequestLabels(pullRequest: AzurePullRequest, labels: string[]) {
    const cmsLabels = pullRequest.labels.filter(l => isCMSLabel(l.name, this.cmsLabelPrefix));
    await Promise.all(
      cmsLabels.map(l => {
        return this.requestText({
          method: 'DELETE',
          url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
            pullRequest.pullRequestId,
          )}/labels/${encodeURIComponent(l.id)}`,
        });
      }),
    );

    await Promise.all(
      labels.map(l => {
        return this.requestText({
          method: 'POST',
          url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(
            pullRequest.pullRequestId,
          )}/labels`,
          body: JSON.stringify({ name: l }),
        });
      }),
    );
  }

  async completePullRequest(pullRequest: AzurePullRequest) {
    const pullRequestCompletion = {
      status: AzurePullRequestStatus.COMPLETED,
      lastMergeSourceCommit: pullRequest.lastMergeSourceCommit,
      completionOptions: {
        deleteSourceBranch: true,
        mergeCommitMessage: MERGE_COMMIT_MESSAGE,
        mergeStrategy: this.mergeStrategy,
      },
    };

    let response = await this.requestJSON<AzurePullRequest>({
      method: 'PATCH',
      url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      body: JSON.stringify(pullRequestCompletion),
    });

    // We need to wait for Azure to complete the pull request to actually complete
    // Sometimes this is instant, but frequently it is 1-3 seconds
    const DELAY_MILLISECONDS = 500;
    const MAX_ATTEMPTS = 10;
    let attempt = 1;
    while (response.mergeStatus === AzureAsyncPullRequestStatus.QUEUED && attempt <= MAX_ATTEMPTS) {
      await delay(DELAY_MILLISECONDS);
      response = await this.requestJSON({
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      });
      attempt = attempt + 1;
    }
  }

  async abandonPullRequest(pullRequest: AzurePullRequest) {
    const pullRequestAbandon = {
      status: AzurePullRequestStatus.ABANDONED,
    };

    await this.requestJSON({
      method: 'PATCH',
      url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      body: JSON.stringify(pullRequestAbandon),
    });

    await this.deleteRef({
      name: pullRequest.sourceRefName,
      objectId: pullRequest.lastMergeSourceCommit.commitId,
    });
  }
}
