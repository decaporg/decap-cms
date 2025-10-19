import { Base64 } from 'js-base64';
import semaphore from 'semaphore';
import initial from 'lodash/initial';
import last from 'lodash/last';
import partial from 'lodash/partial';
import result from 'lodash/result';
import trimStart from 'lodash/trimStart';
import trim from 'lodash/trim';
import { oneLine } from 'common-tags';
import {
  getAllResponses,
  APIError,
  EditorialWorkflowError,
  localForage,
  basename,
  readFileMetadata,
  CMS_BRANCH_PREFIX,
  generateContentKey,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  PreviewState,
  parseContentKey,
  branchFromContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
  contentKeyFromBranch,
  requestWithBackoff,
  unsentRequest,
  throwOnConflictingBranches,
} from 'decap-cms-lib-util';
import { dirname } from 'path';

import type {
  AssetProxy,
  DataFile,
  PersistOptions,
  FetchError,
  ApiRequest,
} from 'decap-cms-lib-util';
import type { Semaphore } from 'semaphore';
import type { Octokit } from '@octokit/rest';

type GitHubUser = Octokit.UsersGetAuthenticatedResponse;
type GitCreateTreeParamsTree = Octokit.GitCreateTreeParamsTree;
type GitHubCompareCommit = Octokit.ReposCompareCommitsResponseCommitsItem;
type GitHubAuthor = Octokit.GitCreateCommitResponseAuthor;
type GitHubCommitter = Octokit.GitCreateCommitResponseCommitter;
type GitHubPull = Octokit.PullsListResponseItem;

export const API_NAME = 'GitHub';

export const MOCK_PULL_REQUEST = -1;

export interface Config {
  apiRoot?: string;
  token?: string;
  tokenKeyword?: string;
  branch?: string;
  useOpenAuthoring?: boolean;
  repo?: string;
  originRepo?: string;
  squashMerges: boolean;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;
  baseUrl?: string;
  getUser: ({ token }: { token: string }) => Promise<GitHubUser>;
}

interface TreeFile {
  type: 'blob' | 'tree';
  sha: string;
  path: string;
  raw?: string;
}

type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type TreeEntry = Override<GitCreateTreeParamsTree, { sha: string | null }>;

type GitHubCompareCommits = GitHubCompareCommit[];

type GitHubCompareFile = Octokit.ReposCompareCommitsResponseFilesItem & {
  previous_filename?: string;
};

type GitHubCompareFiles = GitHubCompareFile[];

enum GitHubCommitStatusState {
  Error = 'error',
  Failure = 'failure',
  Pending = 'pending',
  Success = 'success',
}

export enum PullRequestState {
  Open = 'open',
  Closed = 'closed',
  All = 'all',
}

type GitHubCommitStatus = Octokit.ReposListStatusesForRefResponseItem & {
  state: GitHubCommitStatusState;
};

interface MetaDataObjects {
  entry: { path: string; sha: string };
  files: MediaFile[];
}

export interface Metadata {
  type: string;
  objects: MetaDataObjects;
  branch: string;
  status: string;
  pr?: {
    number: number;
    head: string | { sha: string };
  };
  collection: string;
  commitMessage: string;
  version?: string;
  user: string;
  title?: string;
  description?: string;
  timeStamp: string;
}

export interface BlobArgs {
  sha: string;
  repoURL: string;
  parseText: boolean;
}

type Param = string | number | undefined;

type Options = RequestInit & { params?: Record<string, Param | Record<string, Param> | string[]> };

type MediaFile = {
  sha: string;
  path: string;
};

function withCmsLabel(pr: GitHubPull, cmsLabelPrefix: string) {
  return pr.labels.some(l => isCMSLabel(l.name, cmsLabelPrefix));
}

function withoutCmsLabel(pr: GitHubPull, cmsLabelPrefix: string) {
  return pr.labels.every(l => !isCMSLabel(l.name, cmsLabelPrefix));
}

function getTreeFiles(files: GitHubCompareFiles) {
  const treeFiles = files.reduce((arr, file) => {
    if (file.status === 'removed') {
      // delete the file
      arr.push({ sha: null, path: file.filename });
    } else if (file.status === 'renamed') {
      // delete the previous file
      arr.push({ sha: null, path: file.previous_filename as string });
      // add the renamed file
      arr.push({ sha: file.sha, path: file.filename });
    } else {
      // add the  file
      arr.push({ sha: file.sha, path: file.filename });
    }
    return arr;
  }, [] as { sha: string | null; path: string }[]);

  return treeFiles;
}

export type Diff = {
  path: string;
  newFile: boolean;
  sha: string;
  binary: boolean;
};

let migrationNotified = false;

export default class API {
  apiRoot: string;
  token: string;
  tokenKeyword: string;
  branch: string;
  useOpenAuthoring?: boolean;
  repo: string;
  originRepo: string;
  repoOwner: string;
  repoName: string;
  originRepoOwner: string;
  originRepoName: string;
  repoURL: string;
  originRepoURL: string;
  mergeMethod: string;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;
  baseUrl?: string;
  getUser: ({ token }: { token: string }) => Promise<GitHubUser>;
  _userPromise?: Promise<GitHubUser>;
  _metadataSemaphore?: Semaphore;

  commitAuthor?: {};

  constructor(config: Config) {
    this.apiRoot = config.apiRoot || 'https://api.github.com';
    this.token = config.token || '';
    this.tokenKeyword = config.tokenKeyword || 'token';
    this.branch = config.branch || 'master';
    this.useOpenAuthoring = config.useOpenAuthoring;
    this.repo = config.repo || '';
    this.originRepo = config.originRepo || this.repo;
    this.repoURL = `/repos/${this.repo}`;
    // when not in 'useOpenAuthoring' mode originRepoURL === repoURL
    this.originRepoURL = `/repos/${this.originRepo}`;

    const [repoParts, originRepoParts] = [this.repo.split('/'), this.originRepo.split('/')];
    this.repoOwner = repoParts[0];
    this.repoName = repoParts[1];

    this.originRepoOwner = originRepoParts[0];
    this.originRepoName = originRepoParts[1];

    this.mergeMethod = config.squashMerges ? 'squash' : 'merge';
    this.cmsLabelPrefix = config.cmsLabelPrefix;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.baseUrl = config.baseUrl;
    this.getUser = config.getUser;
  }

  static DEFAULT_COMMIT_MESSAGE = 'Automatically generated by Decap CMS';

  user(): Promise<{ name: string; login: string }> {
    if (!this._userPromise) {
      this._userPromise = this.getUser({ token: this.token });
    }
    return this._userPromise;
  }

  async hasWriteAccess() {
    try {
      const result: Octokit.ReposGetResponse = await this.request(this.repoURL);
      // update config repoOwner to avoid case sensitivity issues with GitHub
      this.repoOwner = result.owner.login;
      return result.permissions.push;
    } catch (error) {
      console.error('Problem fetching repo data from GitHub');
      throw error;
    }
  }

  reset() {
    // no op
  }

  requestHeaders(headers = {}) {
    const baseHeader: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    };

    if (this.token) {
      baseHeader.Authorization = `${this.tokenKeyword} ${this.token}`;
      return Promise.resolve(baseHeader);
    }

    return Promise.resolve(baseHeader);
  }

  parseJsonResponse(response: Response) {
    return response.json().then(json => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  urlFor(path: string, options: Options) {
    const params = [];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${key}=${encodeURIComponent(options.params[key] as string)}`);
      }
    }
    if (params.length) {
      path += `?${params.join('&')}`;
    }
    return this.apiRoot + path;
  }

  parseResponse(response: Response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.match(/json/)) {
      return this.parseJsonResponse(response);
    }
    const textPromise = response.text().then(text => {
      if (!response.ok) {
        return Promise.reject(text);
      }
      return text;
    });
    return textPromise;
  }

  handleRequestError(error: FetchError, responseStatus: number) {
    throw new APIError(error.message, responseStatus, API_NAME);
  }

  buildRequest(req: ApiRequest) {
    return req;
  }

  async request(
    path: string,
    options: Options = {},
    parser = (response: Response) => this.parseResponse(response),
  ) {
    options = { cache: 'no-cache', ...options };
    const headers = await this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus = 500;

    try {
      const req = unsentRequest.fromFetchArguments(url, {
        ...options,
        headers,
      }) as unknown as ApiRequest;
      const response = await requestWithBackoff(this, req);
      responseStatus = response.status;
      const parsedResponse = await parser(response);
      return parsedResponse;
    } catch (error) {
      return this.handleRequestError(error, responseStatus);
    }
  }

  nextUrlProcessor() {
    return (url: string) => url;
  }

  async requestAllPages<T>(url: string, options: Options = {}) {
    options = { cache: 'no-cache', ...options };
    const headers = await this.requestHeaders(options.headers || {});
    const processedURL = this.urlFor(url, options);
    const allResponses = await getAllResponses(
      processedURL,
      { ...options, headers },
      'next',
      this.nextUrlProcessor(),
    );
    const pages: T[][] = await Promise.all(
      allResponses.map((res: Response) => this.parseResponse(res)),
    );
    return ([] as T[]).concat(...pages);
  }

  generateContentKey(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    if (!this.useOpenAuthoring) {
      return contentKey;
    }

    return `${this.repo}/${contentKey}`;
  }

  parseContentKey(contentKey: string) {
    if (!this.useOpenAuthoring) {
      return parseContentKey(contentKey);
    }

    return parseContentKey(contentKey.slice(this.repo.length + 1));
  }

  checkMetadataRef() {
    return this.request(`${this.repoURL}/git/refs/meta/_decap_cms`)
      .then(response => response.object)
      .catch(() => {
        // Meta ref doesn't exist
        const readme = {
          raw: '# Decap CMS\n\nThis tree is used by the Decap CMS to store metadata information for specific files and branches.',
        };

        return this.uploadBlob(readme)
          .then(item =>
            this.request(`${this.repoURL}/git/trees`, {
              method: 'POST',
              body: JSON.stringify({
                tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: item.sha }],
              }),
            }),
          )
          .then(tree => this.commit('First Commit', tree))
          .then(response => this.createRef('meta', '_decap_cms', response.sha))
          .then(response => response.object);
      });
  }

  async storeMetadata(key: string, data: Metadata) {
    // semaphore ensures metadata updates are always ordered, even if
    // calls to storeMetadata are not. concurrent metadata updates
    // will result in the metadata branch being unable to update.
    if (!this._metadataSemaphore) {
      this._metadataSemaphore = semaphore(1);
    }
    return new Promise<void>((resolve, reject) =>
      this._metadataSemaphore?.take(async () => {
        try {
          const branchData = await this.checkMetadataRef();
          const file = { path: `${key}.json`, raw: JSON.stringify(data) };

          await this.uploadBlob(file);
          const changeTree = await this.updateTree(branchData.sha, [file as TreeFile]);
          const { sha } = await this.commit(`Updating “${key}” metadata`, changeTree);
          await this.patchRef('meta', '_decap_cms', sha);
          await localForage.setItem(`gh.meta.${key}`, {
            expires: Date.now() + 300000, // In 5 minutes
            data,
          });
          this._metadataSemaphore?.leave();
          resolve();
        } catch (err) {
          reject(err);
        }
      }),
    );
  }

  deleteMetadata(key: string) {
    if (!this._metadataSemaphore) {
      this._metadataSemaphore = semaphore(1);
    }
    return new Promise<void>(resolve =>
      this._metadataSemaphore?.take(async () => {
        try {
          const branchData = await this.checkMetadataRef();
          const file = { path: `${key}.json`, sha: null };

          const changeTree = await this.updateTree(branchData.sha, [file]);
          const { sha } = await this.commit(`Deleting “${key}” metadata`, changeTree);
          await this.patchRef('meta', '_decap_cms', sha);
          this._metadataSemaphore?.leave();
          resolve();
        } catch (err) {
          this._metadataSemaphore?.leave();
          resolve();
        }
      }),
    );
  }

  async retrieveMetadataOld(key: string): Promise<Metadata> {
    console.log(
      '%c Checking for MetaData files',
      'line-height: 30px;text-align: center;font-weight: bold',
    );

    const metadataRequestOptions = {
      params: { ref: 'refs/meta/_decap_cms' },
      headers: { Accept: 'application/vnd.github.v3.raw' },
    };

    function errorHandler(err: Error) {
      if (err.message === 'Not Found') {
        console.log(
          '%c %s does not have metadata',
          'line-height: 30px;text-align: center;font-weight: bold',
          key,
        );
      }
      throw err;
    }

    if (!this.useOpenAuthoring) {
      const result = await this.request(
        `${this.repoURL}/contents/${key}.json`,
        metadataRequestOptions,
      )
        .then((response: string) => JSON.parse(response))
        .catch(errorHandler);

      return result;
    }

    const [user, repo] = key.split('/');
    const result = this.request(
      `/repos/${user}/${repo}/contents/${key}.json`,
      metadataRequestOptions,
    )
      .then((response: string) => JSON.parse(response))
      .catch(errorHandler);
    return result;
  }

  async getPullRequests(
    head: string | undefined,
    state: PullRequestState,
    predicate: (pr: GitHubPull) => boolean,
  ) {
    const pullRequests: Octokit.PullsListResponse = await this.requestAllPages(
      `${this.originRepoURL}/pulls`,
      {
        params: {
          ...(head ? { head: await this.getHeadReference(head) } : {}),
          base: this.branch,
          state,
          per_page: 100,
        },
      },
    );

    return pullRequests.filter(
      pr => pr.head.ref.startsWith(`${CMS_BRANCH_PREFIX}/`) && predicate(pr),
    );
  }

  async getOpenAuthoringPullRequest(branch: string, pullRequests: GitHubPull[]) {
    // we can't use labels when using open authoring
    // since the contributor doesn't have access to set labels
    // a branch without a pr (or a closed pr) means a 'draft' entry
    // a branch with an opened pr means a 'pending_review' entry
    const data = await this.getBranch(branch).catch(() => {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    });
    // since we get all (open and closed) pull requests by branch name, make sure to filter by head sha
    const pullRequest = pullRequests.filter(pr => pr.head.sha === data.commit.sha)[0];
    // if no pull request is found for the branch we return a mocked one
    if (!pullRequest) {
      try {
        return {
          head: { sha: data.commit.sha },
          number: MOCK_PULL_REQUEST,
          labels: [{ name: statusToLabel(this.initialWorkflowStatus, this.cmsLabelPrefix) }],
          state: PullRequestState.Open,
        } as GitHubPull;
      } catch (e) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
    } else {
      pullRequest.labels = pullRequest.labels.filter(l => !isCMSLabel(l.name, this.cmsLabelPrefix));
      const cmsLabel =
        pullRequest.state === PullRequestState.Closed
          ? { name: statusToLabel(this.initialWorkflowStatus, this.cmsLabelPrefix) }
          : { name: statusToLabel('pending_review', this.cmsLabelPrefix) };

      pullRequest.labels.push(cmsLabel as Octokit.PullsGetResponseLabelsItem);
      return pullRequest;
    }
  }

  async getBranchPullRequest(branch: string) {
    if (this.useOpenAuthoring) {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.All, () => true);
      return this.getOpenAuthoringPullRequest(branch, pullRequests);
    } else {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.Open, pr =>
        withCmsLabel(pr, this.cmsLabelPrefix),
      );
      if (pullRequests.length <= 0) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
      return pullRequests[0];
    }
  }

  async getPullRequestCommits(number: number) {
    if (number === MOCK_PULL_REQUEST) {
      return [];
    }
    try {
      const commits: Octokit.PullsListCommitsResponseItem[] = await this.request(
        `${this.originRepoURL}/pulls/${number}/commits`,
      );
      return commits;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async getPullRequestAuthor(pullRequest: Octokit.PullsListResponseItem) {
    if (!pullRequest.user?.login) {
      return;
    }

    try {
      const user: GitHubUser = await this.request(`/users/${pullRequest.user.login}`);
      return user.name || user.login;
    } catch {
      return;
    }
  }

  async retrieveUnpublishedEntryData(contentKey: string) {
    const { collection, slug } = this.parseContentKey(contentKey);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const [{ files }, pullRequestAuthor] = await Promise.all([
      this.getDifferences(this.branch, pullRequest.head.sha),
      this.getPullRequestAuthor(pullRequest),
    ]);
    const diffs = await Promise.all(files.map(file => this.diffFromFile(file)));
    const label = pullRequest.labels.find(l => isCMSLabel(l.name, this.cmsLabelPrefix)) as {
      name: string;
    };
    const status = labelToStatus(label.name, this.cmsLabelPrefix);
    const updatedAt = pullRequest.updated_at;
    return {
      collection,
      slug,
      status,
      diffs: diffs.map(d => ({ path: d.path, newFile: d.newFile, id: d.sha })),
      updatedAt,
      pullRequestAuthor,
    };
  }

  async readFile(
    path: string,
    sha?: string | null,
    {
      branch = this.branch,
      repoURL = this.repoURL,
      parseText = true,
    }: {
      branch?: string;
      repoURL?: string;
      parseText?: boolean;
    } = {},
  ) {
    if (!sha) {
      sha = await this.getFileSha(path, { repoURL, branch });
    }
    const content = await this.fetchBlobContent({ sha: sha as string, repoURL, parseText });
    return content;
  }

  async readFileMetadata(path: string, sha: string | null | undefined) {
    const fetchFileMetadata = async () => {
      try {
        const result: Octokit.ReposListCommitsResponse = await this.request(
          `${this.originRepoURL}/commits`,
          {
            params: { path, sha: this.branch },
          },
        );
        const { commit } = result[0];
        return {
          author: commit.author.name || commit.author.email,
          updatedOn: commit.author.date,
        };
      } catch (e) {
        return { author: '', updatedOn: '' };
      }
    };
    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  async fetchBlobContent({ sha, repoURL, parseText }: BlobArgs) {
    const result: Octokit.GitGetBlobResponse = await this.request(`${repoURL}/git/blobs/${sha}`, {
      cache: 'force-cache',
    });

    if (parseText) {
      // treat content as a utf-8 string
      const content = Base64.decode(result.content);
      return content;
    } else {
      // treat content as binary and convert to blob
      const content = Base64.atob(result.content);
      const byteArray = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        byteArray[i] = content.charCodeAt(i);
      }
      const blob = new Blob([byteArray]);
      return blob;
    }
  }

  async listFiles(
    path: string,
    { repoURL = this.repoURL, branch = this.branch, depth = 1 } = {},
  ): Promise<{ type: string; id: string; name: string; path: string; size: number }[]> {
    const folder = trim(path, '/');
    try {
      const result: Octokit.GitGetTreeResponse = await this.request(
        `${repoURL}/git/trees/${branch}:${folder}`,
        {
          // GitHub API supports recursive=1 for getting the entire recursive tree
          // or omitting it to get the non-recursive tree
          params: depth > 1 ? { recursive: 1 } : {},
        },
      );
      return (
        result.tree
          // filter only files and up to the required depth
          .filter(file => file.type === 'blob' && file.path.split('/').length <= depth)
          .map(file => ({
            type: file.type,
            id: file.sha,
            name: basename(file.path),
            path: `${folder}/${file.path}`,
            size: file.size!,
          }))
      );
    } catch (err) {
      if (err && err.status === 404) {
        console.log('This 404 was expected and handled appropriately.');
        return [];
      } else {
        throw err;
      }
    }
  }

  filterOpenAuthoringBranches = async (branch: string) => {
    try {
      const pullRequest = await this.getBranchPullRequest(branch);
      const { state: currentState, merged_at: mergedAt } = pullRequest;
      if (
        pullRequest.number !== MOCK_PULL_REQUEST &&
        currentState === PullRequestState.Closed &&
        mergedAt
      ) {
        // pr was merged, delete branch
        await this.deleteBranch(branch);
        return { branch, filter: false };
      } else {
        return { branch, filter: true };
      }
    } catch (e) {
      return { branch, filter: false };
    }
  };

  async migrateToVersion1(pullRequest: GitHubPull, metadata: Metadata) {
    // hard code key/branch generation logic to ignore future changes
    const oldContentKey = pullRequest.head.ref.slice(`cms/`.length);
    const newContentKey = `${metadata.collection}/${oldContentKey}`;
    const newBranchName = `cms/${newContentKey}`;

    // retrieve or create new branch and pull request in new format
    const branch = await this.getBranch(newBranchName).catch(() => undefined);
    if (!branch) {
      await this.createBranch(newBranchName, pullRequest.head.sha as string);
    }

    const pr =
      (await this.getPullRequests(newBranchName, PullRequestState.All, () => true))[0] ||
      (await this.createPR(pullRequest.title, newBranchName));

    // store new metadata
    const newMetadata = {
      ...metadata,
      pr: {
        number: pr.number,
        head: pr.head.sha,
      },
      branch: newBranchName,
      version: '1',
    };
    await this.storeMetadata(newContentKey, newMetadata);

    // remove old data
    await this.closePR(pullRequest.number);
    await this.deleteBranch(pullRequest.head.ref);
    await this.deleteMetadata(oldContentKey);

    return { metadata: newMetadata, pullRequest: pr };
  }

  async migrateToPullRequestLabels(pullRequest: GitHubPull, metadata: Metadata) {
    await this.setPullRequestStatus(pullRequest, metadata.status);

    const contentKey = pullRequest.head.ref.slice(`cms/`.length);
    await this.deleteMetadata(contentKey);
  }

  async migratePullRequest(pullRequest: GitHubPull, countMessage: string) {
    const { number } = pullRequest;
    console.log(`Migrating Pull Request '${number}' (${countMessage})`);
    const contentKey = contentKeyFromBranch(pullRequest.head.ref);
    let metadata = await this.retrieveMetadataOld(contentKey).catch(() => undefined);

    if (!metadata) {
      console.log(`Skipped migrating Pull Request '${number}' (${countMessage})`);
      return;
    }

    let newNumber = number;
    if (!metadata.version) {
      console.log(`Migrating Pull Request '${number}' to version 1`);
      // migrate branch from cms/slug to cms/collection/slug
      try {
        ({ metadata, pullRequest } = await this.migrateToVersion1(pullRequest, metadata));
      } catch (e) {
        console.log(`Failed to migrate Pull Request '${number}' to version 1. See error below.`);
        console.error(e);
        return;
      }
      newNumber = pullRequest.number;
      console.log(
        `Done migrating Pull Request '${number}' to version 1. New pull request '${newNumber}' created.`,
      );
    }

    if (metadata.version === '1') {
      console.log(`Migrating Pull Request '${newNumber}' to labels`);
      // migrate branch from using orphan ref to store metadata to pull requests label
      await this.migrateToPullRequestLabels(pullRequest, metadata);
      console.log(`Done migrating Pull Request '${newNumber}' to labels`);
    }

    console.log(
      `Done migrating Pull Request '${
        number === newNumber ? newNumber : `${number} => ${newNumber}`
      }'`,
    );
  }

  async getOpenAuthoringBranches() {
    const cmsBranches = await this.requestAllPages<Octokit.GitListMatchingRefsResponseItem>(
      `${this.repoURL}/git/refs/heads/cms/${this.repo}`,
    ).catch(() => [] as Octokit.GitListMatchingRefsResponseItem[]);
    return cmsBranches;
  }

  async listUnpublishedBranches() {
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );

    let branches: string[];
    if (this.useOpenAuthoring) {
      // open authoring branches can exist without a pr
      const cmsBranches: Octokit.GitListMatchingRefsResponse =
        await this.getOpenAuthoringBranches();
      branches = cmsBranches.map(b => b.ref.slice('refs/heads/'.length));
      // filter irrelevant branches
      const branchesWithFilter = await Promise.all(
        branches.map(b => this.filterOpenAuthoringBranches(b)),
      );
      branches = branchesWithFilter.filter(b => b.filter).map(b => b.branch);
    } else {
      // backwards compatibility code, get relevant pull requests and migrate them
      const pullRequests = await this.getPullRequests(
        undefined,
        PullRequestState.Open,
        pr => !pr.head.repo.fork && withoutCmsLabel(pr, this.cmsLabelPrefix),
      );
      let prCount = 0;
      for (const pr of pullRequests) {
        if (!migrationNotified) {
          migrationNotified = true;
          alert(oneLine`
            Decap CMS is adding labels to ${pullRequests.length} of your Editorial Workflow
            entries. The "Workflow" tab will be unavailable during this migration. You may use other
            areas of the CMS during this time. Note that closing the CMS will pause the migration.
          `);
        }
        prCount = prCount + 1;
        await this.migratePullRequest(pr, `${prCount} of ${pullRequests.length}`);
      }
      const cmsPullRequests = await this.getPullRequests(undefined, PullRequestState.Open, pr =>
        withCmsLabel(pr, this.cmsLabelPrefix),
      );
      branches = cmsPullRequests.map(pr => pr.head.ref);
    }

    return branches;
  }

  /**
   * Retrieve statuses for a given SHA. Unrelated to the editorial workflow
   * concept of entry "status". Useful for things like deploy preview links.
   */
  async getStatuses(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const sha = pullRequest.head.sha;
    const resp: { statuses: GitHubCommitStatus[] } = await this.request(
      `${this.originRepoURL}/commits/${sha}/status`,
    );
    return resp.statuses.map(s => ({
      context: s.context,
      target_url: s.target_url,
      state:
        s.state === GitHubCommitStatusState.Success ? PreviewState.Success : PreviewState.Other,
    }));
  }

  async persistFiles(dataFiles: DataFile[], mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = mediaFiles.concat(dataFiles);
    const uploadPromises = files.map(file => this.uploadBlob(file));
    await Promise.all(uploadPromises);

    if (!options.useWorkflow) {
      return this.getDefaultBranch()
        .then(branchData =>
          this.updateTree(branchData.commit.sha, files as { sha: string; path: string }[]),
        )
        .then(changeTree => this.commit(options.commitMessage, changeTree))
        .then(response => this.patchBranch(this.branch, response.sha));
    } else {
      const mediaFilesList = (mediaFiles as { sha: string; path: string }[]).map(
        ({ sha, path }) => ({
          path: trimStart(path, '/'),
          sha,
        }),
      );
      const slug = dataFiles[0].slug;
      return this.editorialWorkflowGit(files as TreeFile[], slug, mediaFilesList, options);
    }
  }

  async getFileSha(path: string, { repoURL = this.repoURL, branch = this.branch } = {}) {
    /**
     * We need to request the tree first to get the SHA. We use extended SHA-1
     * syntax (<rev>:<path>) to get a blob from a tree without having to recurse
     * through the tree.
     */

    const pathArray = path.split('/');
    const filename = last(pathArray);
    const directory = initial(pathArray).join('/');
    const fileDataPath = encodeURIComponent(directory);
    const fileDataURL = `${repoURL}/git/trees/${branch}:${fileDataPath}`;

    const result: Octokit.GitGetTreeResponse = await this.request(fileDataURL);
    const file = result.tree.find(file => file.path === filename);
    if (file) {
      return file.sha;
    } else {
      throw new APIError('Not Found', 404, API_NAME);
    }
  }

  async deleteFiles(paths: string[], message: string) {
    if (this.useOpenAuthoring) {
      return Promise.reject('Cannot delete published entries as an Open Authoring user!');
    }

    const branchData = await this.getDefaultBranch();
    const files = paths.map(path => ({ path, sha: null }));
    const changeTree = await this.updateTree(branchData.commit.sha, files);
    const commit = await this.commit(message, changeTree);
    await this.patchBranch(this.branch, commit.sha);
  }

  async createBranchAndPullRequest(branchName: string, sha: string, commitMessage: string) {
    await this.createBranch(branchName, sha);
    return this.createPR(commitMessage, branchName);
  }

  async updatePullRequestLabels(number: number, labels: string[]) {
    await this.request(`${this.repoURL}/issues/${number}/labels`, {
      method: 'PUT',
      body: JSON.stringify({ labels }),
    });
  }

  // async since it is overridden in a child class
  async diffFromFile(diff: Octokit.ReposCompareCommitsResponseFilesItem): Promise<Diff> {
    return {
      path: diff.filename,
      newFile: diff.status === 'added',
      sha: diff.sha,
      // media files diffs don't have a patch attribute, except svg files
      // renamed files don't have a patch attribute too
      binary: (diff.status !== 'renamed' && !diff.patch) || diff.filename.endsWith('.svg'),
    };
  }

  async editorialWorkflowGit(
    files: TreeFile[],
    slug: string,
    mediaFilesList: MediaFile[],
    options: PersistOptions,
  ) {
    const contentKey = this.generateContentKey(options.collectionName as string, slug);
    const branch = branchFromContentKey(contentKey);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      const branchData = await this.getDefaultBranch();
      const changeTree = await this.updateTree(branchData.commit.sha, files);
      const commitResponse = await this.commit(options.commitMessage, changeTree);

      if (this.useOpenAuthoring) {
        await this.createBranch(branch, commitResponse.sha);
      } else {
        const pr = await this.createBranchAndPullRequest(
          branch,
          commitResponse.sha,
          options.commitMessage,
        );
        await this.setPullRequestStatus(pr, options.status || this.initialWorkflowStatus);
      }
    } else {
      // Entry is already on editorial review workflow - commit to existing branch
      const { files: diffFiles } = await this.getDifferences(
        this.branch,
        await this.getHeadReference(branch),
      );

      const diffs = await Promise.all(diffFiles.map(file => this.diffFromFile(file)));
      // mark media files to remove
      const mediaFilesToRemove: { path: string; sha: string | null }[] = [];
      for (const diff of diffs.filter(d => d.binary)) {
        if (!mediaFilesList.some(file => file.path === diff.path)) {
          mediaFilesToRemove.push({ path: diff.path, sha: null });
        }
      }

      // rebase the branch before applying new changes
      const rebasedHead = await this.rebaseBranch(branch);
      const treeFiles = mediaFilesToRemove.concat(files);
      const changeTree = await this.updateTree(rebasedHead.sha, treeFiles, branch);
      const commit = await this.commit(options.commitMessage, changeTree);

      return this.patchBranch(branch, commit.sha, { force: true });
    }
  }

  async getDifferences(from: string, to: string) {
    // retry this as sometimes GitHub returns an initial 404 on cross repo compare
    const attempts = this.useOpenAuthoring ? 10 : 1;
    for (let i = 1; i <= attempts; i++) {
      try {
        const result: Octokit.ReposCompareCommitsResponse = await this.request(
          `${this.originRepoURL}/compare/${from}...${to}`,
        );
        return result;
      } catch (e) {
        if (i === attempts) {
          console.warn(`Reached maximum number of attempts '${attempts}' for getDifferences`);
          throw e;
        }
        await new Promise(resolve => setTimeout(resolve, i * 500));
      }
    }
    throw new APIError('Not Found', 404, API_NAME);
  }

  async rebaseSingleCommit(baseCommit: GitHubCompareCommit, commit: GitHubCompareCommit) {
    // first get the diff between the commits
    const result = await this.getDifferences(commit.parents[0].sha, commit.sha);
    const files = getTreeFiles(result.files as GitHubCompareFiles);

    // only update the tree if changes were detected
    if (files.length > 0) {
      // create a tree with baseCommit as the base with the diff applied
      const tree = await this.updateTree(baseCommit.sha, files);
      const { message, author, committer } = commit.commit;

      // create a new commit from the updated tree
      const newCommit = await this.createCommit(
        message,
        tree.sha,
        [baseCommit.sha],
        author,
        committer,
      );
      return newCommit as unknown as GitHubCompareCommit;
    } else {
      return commit;
    }
  }

  /**
   * Rebase an array of commits one-by-one, starting from a given base SHA
   */
  async rebaseCommits(baseCommit: GitHubCompareCommit, commits: GitHubCompareCommits) {
    /**
     * If the parent of the first commit already matches the target base,
     * return commits as is.
     */
    if (commits.length === 0 || commits[0].parents[0].sha === baseCommit.sha) {
      const head = last(commits) as GitHubCompareCommit;
      return head;
    } else {
      /**
       * Re-create each commit over the new base, applying each to the previous,
       * changing only the parent SHA and tree for each, but retaining all other
       * info, such as the author/committer data.
       */
      const newHeadPromise = commits.reduce((lastCommitPromise, commit) => {
        return lastCommitPromise.then(newParent => {
          const parent = newParent;
          const commitToRebase = commit;
          return this.rebaseSingleCommit(parent, commitToRebase);
        });
      }, Promise.resolve(baseCommit));
      return newHeadPromise;
    }
  }

  async rebaseBranch(branch: string) {
    try {
      // Get the diff between the default branch the published branch
      const { base_commit: baseCommit, commits } = await this.getDifferences(
        this.branch,
        await this.getHeadReference(branch),
      );
      // Rebase the branch based on the diff
      const rebasedHead = await this.rebaseCommits(baseCommit, commits);
      return rebasedHead;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async setPullRequestStatus(pullRequest: GitHubPull, newStatus: string) {
    const labels = [
      ...pullRequest.labels
        .filter(label => !isCMSLabel(label.name, this.cmsLabelPrefix))
        .map(l => l.name),
      statusToLabel(newStatus, this.cmsLabelPrefix),
    ];
    await this.updatePullRequestLabels(pullRequest.number, labels);
  }

  async updateUnpublishedEntryStatus(collectionName: string, slug: string, newStatus: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    if (!this.useOpenAuthoring) {
      await this.setPullRequestStatus(pullRequest, newStatus);
    } else {
      if (status === 'pending_publish') {
        throw new Error('Open Authoring entries may not be set to the status "pending_publish".');
      }

      if (pullRequest.number !== MOCK_PULL_REQUEST) {
        const { state } = pullRequest;
        if (state === PullRequestState.Open && newStatus === 'draft') {
          await this.closePR(pullRequest.number);
        }
        if (state === PullRequestState.Closed && newStatus === 'pending_review') {
          await this.openPR(pullRequest.number);
        }
      } else if (newStatus === 'pending_review') {
        const branch = branchFromContentKey(contentKey);
        // get the first commit message as the pr title
        const diff = await this.getDifferences(this.branch, await this.getHeadReference(branch));
        const title = diff.commits[0]?.commit?.message || API.DEFAULT_COMMIT_MESSAGE;
        await this.createPR(title, branch);
      }
    }
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);

    const pullRequest = await this.getBranchPullRequest(branch);
    if (pullRequest.number !== MOCK_PULL_REQUEST) {
      await this.closePR(pullRequest.number);
    }
    await this.deleteBranch(branch);
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);

    const pullRequest = await this.getBranchPullRequest(branch);
    await this.mergePR(pullRequest);
    await this.deleteBranch(branch);
  }

  async createRef(type: string, name: string, sha: string) {
    const result: Octokit.GitCreateRefResponse = await this.request(`${this.repoURL}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/${type}/${name}`, sha }),
    });
    return result;
  }

  async patchRef(type: string, name: string, sha: string, opts: { force?: boolean } = {}) {
    const force = opts.force || false;
    const result: Octokit.GitUpdateRefResponse = await this.request(
      `${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ sha, force }),
      },
    );
    return result;
  }

  deleteRef(type: string, name: string) {
    return this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async getBranch(branch: string) {
    const result: Octokit.ReposGetBranchResponse = await this.request(
      `${this.repoURL}/branches/${encodeURIComponent(branch)}`,
    );
    return result;
  }

  async getDefaultBranch() {
    const result: Octokit.ReposGetBranchResponse = await this.request(
      `${this.originRepoURL}/branches/${encodeURIComponent(this.branch)}`,
    );
    return result;
  }

  async backupBranch(branchName: string) {
    try {
      const existingBranch = await this.getBranch(branchName);
      await this.createBranch(
        existingBranch.name.replace(
          new RegExp(`${CMS_BRANCH_PREFIX}/`),
          `${CMS_BRANCH_PREFIX}_${Date.now()}/`,
        ),
        existingBranch.commit.sha,
      );
    } catch (e) {
      console.warn(e);
    }
  }

  async createBranch(branchName: string, sha: string) {
    try {
      const result = await this.createRef('heads', branchName, sha);
      return result;
    } catch (e) {
      const message = String(e.message || '');
      if (message === 'Reference update failed') {
        await throwOnConflictingBranches(branchName, name => this.getBranch(name), API_NAME);
      } else if (
        message === 'Reference already exists' &&
        branchName.startsWith(`${CMS_BRANCH_PREFIX}/`)
      ) {
        try {
          // this can happen if the branch wasn't deleted when the PR was merged
          // we backup the existing branch just in case and patch it with the new sha
          await this.backupBranch(branchName);
          const result = await this.patchBranch(branchName, sha, { force: true });
          return result;
        } catch (e) {
          console.log(e);
        }
      }
      throw e;
    }
  }

  assertCmsBranch(branchName: string) {
    return branchName.startsWith(`${CMS_BRANCH_PREFIX}/`);
  }

  patchBranch(branchName: string, sha: string, opts: { force?: boolean } = {}) {
    const force = opts.force || false;
    if (force && !this.assertCmsBranch(branchName)) {
      throw Error(`Only CMS branches can be force updated, cannot force update ${branchName}`);
    }
    return this.patchRef('heads', branchName, sha, { force });
  }

  deleteBranch(branchName: string) {
    return this.deleteRef('heads', branchName).catch((err: Error) => {
      // If the branch doesn't exist, then it has already been deleted -
      // deletion should be idempotent, so we can consider this a
      // success.
      if (err.message === 'Reference does not exist') {
        return Promise.resolve();
      }
      console.error(err);
      return Promise.reject(err);
    });
  }

  async getHeadReference(head: string) {
    return `${this.repoOwner}:${head}`;
  }

  async createPR(title: string, head: string) {
    const result: Octokit.PullsCreateResponse = await this.request(`${this.originRepoURL}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: DEFAULT_PR_BODY,
        head: await this.getHeadReference(head),
        base: this.branch,
      }),
    });

    return result;
  }

  async openPR(number: number) {
    console.log('%c Re-opening PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result: Octokit.PullsUpdateBranchResponse = await this.request(
      `${this.originRepoURL}/pulls/${number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: PullRequestState.Open,
        }),
      },
    );
    return result;
  }

  async closePR(number: number) {
    console.log('%c Deleting PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result: Octokit.PullsUpdateBranchResponse = await this.request(
      `${this.originRepoURL}/pulls/${number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: PullRequestState.Closed,
        }),
      },
    );
    return result;
  }

  async mergePR(pullrequest: GitHubPull) {
    console.log('%c Merging PR', 'line-height: 30px;text-align: center;font-weight: bold');
    try {
      const result: Octokit.PullsMergeResponse = await this.request(
        `${this.originRepoURL}/pulls/${pullrequest.number}/merge`,
        {
          method: 'PUT',
          body: JSON.stringify({
            commit_message: MERGE_COMMIT_MESSAGE,
            sha: pullrequest.head.sha,
            merge_method: this.mergeMethod,
          }),
        },
      );
      return result;
    } catch (error) {
      if (error instanceof APIError && error.status === 405) {
        return this.forceMergePR(pullrequest);
      } else {
        throw error;
      }
    }
  }

  async forceMergePR(pullRequest: GitHubPull) {
    const result = await this.getDifferences(pullRequest.base.sha, pullRequest.head.sha);
    const files = getTreeFiles(result.files as GitHubCompareFiles);

    let commitMessage = 'Automatically generated. Merged on Decap CMS\n\nForce merge of:';
    files.forEach(file => {
      commitMessage += `\n* "${file.path}"`;
    });
    console.log(
      '%c Automatic merge not possible - Forcing merge.',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    return this.getDefaultBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, files))
      .then(changeTree => this.commit(commitMessage, changeTree))
      .then(response => this.patchBranch(this.branch, response.sha));
  }

  toBase64(str: string) {
    return Promise.resolve(Base64.encode(str));
  }

  async uploadBlob(item: { raw?: string; sha?: string; toBase64?: () => Promise<string> }) {
    const contentBase64 = await result(
      item,
      'toBase64',
      partial(this.toBase64, item.raw as string),
    );
    const response = await this.request(`${this.repoURL}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: contentBase64,
        encoding: 'base64',
      }),
    });
    item.sha = response.sha;
    return item;
  }

  async updateTree(
    baseSha: string,
    files: { path: string; sha: string | null; newPath?: string }[],
    branch = this.branch,
  ) {
    const toMove: { from: string; to: string; sha: string }[] = [];
    const tree = files.reduce((acc, file) => {
      const entry = {
        path: trimStart(file.path, '/'),
        mode: '100644',
        type: 'blob',
        sha: file.sha,
      } as TreeEntry;

      if (file.newPath) {
        toMove.push({ from: file.path, to: file.newPath, sha: file.sha as string });
      } else {
        acc.push(entry);
      }

      return acc;
    }, [] as TreeEntry[]);

    for (const { from, to, sha } of toMove) {
      const sourceDir = dirname(from);
      const destDir = dirname(to);
      const files = await this.listFiles(sourceDir, { branch, depth: 100 });
      for (const file of files) {
        // delete current path
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        });
        // create in new path
        tree.push({
          path: file.path.replace(sourceDir, destDir),
          mode: '100644',
          type: 'blob',
          sha: file.path === from ? sha : file.id,
        });
      }
    }

    const newTree = await this.createTree(baseSha, tree);
    return { ...newTree, parentSha: baseSha };
  }

  async createTree(baseSha: string, tree: TreeEntry[]) {
    const result: Octokit.GitCreateTreeResponse = await this.request(`${this.repoURL}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseSha, tree }),
    });
    return result;
  }

  commit(message: string, changeTree: { parentSha?: string; sha: string }) {
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.createCommit(message, changeTree.sha, parents);
  }

  async createCommit(
    message: string,
    treeSha: string,
    parents: string[],
    author?: GitHubAuthor,
    committer?: GitHubCommitter,
  ) {
    const result: Octokit.GitCreateCommitResponse = await this.request(
      `${this.repoURL}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({ message, tree: treeSha, parents, author, committer }),
      },
    );
    return result;
  }

  async getUnpublishedEntrySha(collection: string, slug: string) {
    const contentKey = this.generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    return pullRequest.head.sha;
  }
}
