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
import { dirname } from 'path';

export const API_NAME = 'Azure DevOps';

type AzureUser = {
  id: string;
  displayName: string;
  emailAddress: string;
};

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/items/get?view=azure-devops-rest-6.0#gititem
type AzureGitItem = {
  // this is the response we see in Azure, but it is just documented as "Object[]" so it is inconsistent
  _links: {
    tree: {
      href: string;
    };
  };
  commitId: string;
  isFolder: boolean;
  isSymLink: boolean;
};

type AzureGitTreeEntryRef = {
  gitObjectType: string;
  objectId: string;
  relativePath: string;
  size: number;
  url: string;
};

type AzureGitTreeRef = {
  _links: AzureReferenceLinks[];
  url: string;
  href: string;
  treeEntries?: AzureGitTreeEntryRef[];
};

type AzureReferenceLinks = {
  links: object[];
  tree?: AzureGitTreeRef;
};

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull%20requests/get%20pull%20request?view=azure-devops-rest-6.0#gitpullrequest
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
  isDraft: string;
  status: AzurePullRequestStatus;
  lastMergeSourceCommit: AzureGitChangeItem;
  mergeStatus: AzureAsyncPullRequestStatus;
  pullRequestId: number;
  labels: AzureWebApiTagDefinition[];
  sourceRefName: string;
};

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

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-6.0#gitcommitdiffs
interface AzureGitCommitDiffs {
  changes: AzureGitChange[];
}

// https://docs.microsoft.com/en-us/rest/api/azure/devops/git/diffs/get?view=azure-devops-rest-6.0#gitchange
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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getChangeItem = (item: AzureCommitItem) => {
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
        sourceServerItem: item.path,
        ...(item.base64Content && {
          newContent: {
            content: item.base64Content,
            contentType: AzureItemContentType.BASE64,
          },
        }),
      };
    default:
      return {};
  }
};

type AzureCommitItem = {
  action: AzureCommitChangeType;
  base64Content?: string;
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

  withAzureFeatures = (req: ApiRequest) => {
    const withParams = unsentRequest.withParams(
      {
        'api-version': this.apiVersion,
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
    const user = await this.requestJSON<AzureUser>({
      url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me',
    });
    return user;
  };

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
        });

        const { value } = await this.responseToJSON(result);
        const [commit] = value;

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

  readFile = async (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch } = {},
  ) => {
    const fetchContent = async () => {
      return await this.request({
        url: `${this.endpointUrl}/items/`,
        params: { version: branch, path },
        cache: 'no-store',
      }).then<Blob | string>(parseText ? this.responseToText : this.responseToBlob);
    };

    return await readFile(sha, fetchContent, localForage, parseText);
  };

  listFiles = async (path: string, recursive = false, branch = this.branch) => {
    try {
      const azureGitItemParams: Record<string, string> = recursive
        ? {
            version: branch,
            scopePath: path,
            recursionLevel: 'full',
          }
        : {
            version: branch,
            path,
            recursionLevel: 'none',
          };

      const azureGitItem = await this.requestJSON<AzureGitItem>({
        url: `${this.endpointUrl}/items/`,
        params: azureGitItemParams,
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
    const refs: { value: AzureRef[] } = await this.requestJSON({
      url: `${this.endpointUrl}/refs`,
      params: {
        $top: '1', // There's only one, so keep the payload small
        filter: 'heads/' + branch,
      },
    });

    return refs.value.find(b => b.name == this.branchToRef(branch))!;
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
    message: string,
    branch: string,
    newBranch: boolean,
  ) {
    const ref = await this.getRef(newBranch ? branch : this.branch);
    const refUpdate = {
      name: this.branchToRef(branch),
      oldObjectId: ref.objectId,
    };

    const changes = items.map(item => getChangeItem(item));
    const commit = [{ message, changes }];
    const push = {
      refUpdates: [refUpdate],
      commits: [commit],
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
        const path = d.item.path;
        const newFile = d.changeType === 'add';
        const id = d.item.objectId;
        return { id, path, newFile };
      }),
    );
    const label = pullRequest.labels.find(l => isCMSLabel(l.name, this.cmsLabelPrefix));
    const labelName = label && label.name ? label.name : this.cmsLabelPrefix;
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

  async getStatuses(collection: string, slug: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
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

        let action = AzureCommitChangeType.ADD;
        let path = trimStart(file.path, '/');
        let oldPath = undefined;
        if (fileExists) {
          oldPath = file.newPath && path;
          action =
            file.newPath && file.newPath !== oldPath
              ? AzureCommitChangeType.RENAME
              : AzureCommitChangeType.EDIT;
          path = file.newPath ? trimStart(file.newPath, '/') : path;
        }

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
        .filter(f => f.relativePath !== item.oldPath)
        .forEach(file => {
          items.push({
            action: AzureCommitChangeType.RENAME,
            path: file.relativePath.replace(sourceDir, destDir),
            oldPath: file.relativePath,
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
      return this.uploadAndCommit(items, options.commitMessage, this.branch, false);
    }
  }

  async deleteFiles(paths: string[], message: string) {
    const ref = await this.getRef(this.branch);
    const refUpdate = {
      name: ref.name,
      oldObjectId: ref.objectId,
    };

    const changes = paths.map(path =>
      getChangeItem({ action: AzureCommitChangeType.DELETE, path }),
    );
    const commit = [{ message, changes }];
    const push = {
      refUpdates: [refUpdate],
      commits: [commit],
    };

    return this.requestJSON({
      url: `${this.endpointUrl}/pushes`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(push),
    });
  }

  async getPullRequests(sourceBranch?: string) {
    const pullRequests = await this.requestJSON<AzureArray<AzurePullRequest>>({
      url: `${this.endpointUrl}/pullrequests`,
      params: {
        'searchCriteria.status': 'active',
        'searchCriteria.targetRefName': this.branchToRef(this.branch),
        'searchCriteria.includeLinks': false,
        ...(sourceBranch ? { 'searchCriteria.sourceRefName': this.branchToRef(sourceBranch) } : {}),
      },
    });

    const filtered = pullRequests.value.filter(pr => {
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

    return result.changes;
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
    const mergeRequest = await this.getBranchPullRequest(branch);
    await this.abandonPullRequest(mergeRequest);
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const mergeRequest = await this.getBranchPullRequest(branch);
    await this.completePullRequest(mergeRequest);
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
    while (response.mergeStatus === 'queued') {
      await delay(500);
      response = await this.requestJSON({
        url: `${this.endpointUrl}/pullrequests/${encodeURIComponent(pullRequest.pullRequestId)}`,
      });
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
