import { flow, get } from 'lodash';
import {
  localForage,
  unsentRequest,
  responseParser,
  then,
  basename,
  Cursor,
  APIError,
  ApiRequest,
  AssetProxy,
  Entry,
  PersistOptions,
  readFile,
  CMS_BRANCH_PREFIX,
  generateContentKey,
  labelToStatus,
  isCMSLabel,
  EditorialWorkflowError,
  statusToLabel,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  PreviewState,
  FetchError,
  parseContentKey,
  branchFromContentKey,
  requestWithBackoff,
  readFileMetadata,
  throwOnConflictingBranches,
} from 'netlify-cms-lib-util';
import { dirname } from 'path';
import { oneLine } from 'common-tags';
import { parse } from 'what-the-diff';

interface Config {
  apiRoot?: string;
  token?: string;
  branch?: string;
  repo?: string;
  requestFunction?: (req: ApiRequest) => Promise<Response>;
  hasWriteAccess?: () => Promise<boolean>;
  squashMerges: boolean;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;
}

interface CommitAuthor {
  name: string;
  email: string;
}

enum BitBucketPullRequestState {
  MERGED = 'MERGED',
  SUPERSEDED = 'SUPERSEDED',
  OPEN = 'OPEN',
  DECLINED = 'DECLINED',
}

type BitBucketPullRequest = {
  description: string;
  id: number;
  title: string;
  state: BitBucketPullRequestState;
  updated_on: string;
  summary: {
    raw: string;
  };
  source: {
    commit: {
      hash: string;
    };
    branch: {
      name: string;
    };
  };
  destination: {
    commit: {
      hash: string;
    };
    branch: {
      name: string;
    };
  };
};

type BitBucketPullRequests = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  preview: string;
  values: BitBucketPullRequest[];
};

type BitBucketPullComment = {
  content: {
    raw: string;
  };
};

type BitBucketPullComments = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  preview: string;
  values: BitBucketPullComment[];
};

enum BitBucketPullRequestStatusState {
  Successful = 'SUCCESSFUL',
  Failed = 'FAILED',
  InProgress = 'INPROGRESS',
  Stopped = 'STOPPED',
}

type BitBucketPullRequestStatus = {
  uuid: string;
  name: string;
  key: string;
  refname: string;
  url: string;
  description: string;
  state: BitBucketPullRequestStatusState;
};

type BitBucketPullRequestStatues = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  preview: string;
  values: BitBucketPullRequestStatus[];
};

type DeleteEntry = {
  path: string;
  delete: true;
};

type BitBucketFile = {
  id: string;
  type: string;
  path: string;
  commit?: { hash: string };
};

type BitBucketSrcResult = {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: BitBucketFile[];
};

type BitBucketUser = {
  username: string;
  display_name: string;
  nickname: string;
  links: {
    avatar: {
      href: string;
    };
  };
};

type BitBucketBranch = {
  name: string;
  target: { hash: string };
};

type BitBucketCommit = {
  hash: string;
  author: {
    raw: string;
    user: {
      display_name: string;
      nickname: string;
    };
  };
  date: string;
};

export const API_NAME = 'Bitbucket';

const APPLICATION_JSON = 'application/json; charset=utf-8';

const replace404WithEmptyResponse = (err: FetchError) => {
  if (err && err.status === 404) {
    console.log('This 404 was expected and handled appropriately.');
    return { size: 0, values: [] as BitBucketFile[] } as BitBucketSrcResult;
  } else {
    return Promise.reject(err);
  }
};

export default class API {
  apiRoot: string;
  branch: string;
  repo: string;
  requestFunction: (req: ApiRequest) => Promise<Response>;
  repoURL: string;
  commitAuthor?: CommitAuthor;
  mergeStrategy: string;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;

  constructor(config: Config) {
    this.apiRoot = config.apiRoot || 'https://api.bitbucket.org/2.0';
    this.branch = config.branch || 'master';
    this.repo = config.repo || '';
    this.requestFunction = config.requestFunction || unsentRequest.performRequest;
    // Allow overriding this.hasWriteAccess
    this.hasWriteAccess = config.hasWriteAccess || this.hasWriteAccess;
    this.repoURL = this.repo ? `/repositories/${this.repo}` : '';
    this.mergeStrategy = config.squashMerges ? 'squash' : 'merge_commit';
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.cmsLabelPrefix = config.cmsLabelPrefix;
  }

  buildRequest = (req: ApiRequest) => {
    const withRoot = unsentRequest.withRoot(this.apiRoot)(req);
    if (withRoot.has('cache')) {
      return withRoot;
    } else {
      const withNoCache = unsentRequest.withNoCache(withRoot);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestJSON = (req: ApiRequest) => this.request(req).then(this.responseToJSON) as Promise<any>;
  requestText = (req: ApiRequest) => this.request(req).then(this.responseToText) as Promise<string>;

  user = () => this.requestJSON('/user') as Promise<BitBucketUser>;

  hasWriteAccess = async () => {
    const response = await this.request(this.repoURL);
    if (response.status === 404) {
      throw Error('Repo not found');
    }
    return response.ok;
  };

  getBranch = async (branchName: string) => {
    const branch: BitBucketBranch = await this.requestJSON(
      `${this.repoURL}/refs/branches/${branchName}`,
    );

    return branch;
  };

  branchCommitSha = async (branch: string) => {
    const {
      target: { hash: branchSha },
    }: BitBucketBranch = await this.getBranch(branch);

    return branchSha;
  };

  defaultBranchCommitSha = () => {
    return this.branchCommitSha(this.branch);
  };

  isFile = ({ type }: BitBucketFile) => type === 'commit_file';

  getFileId = (commitHash: string, path: string) => {
    return `${commitHash}/${path}`;
  };

  processFile = (file: BitBucketFile) => ({
    id: file.id,
    type: file.type,
    path: file.path,
    name: basename(file.path),

    // BitBucket does not return file SHAs, but it does give us the
    // commit SHA. Since the commit SHA will change if any files do,
    // we can construct an ID using the commit SHA and the file path
    // that will help with caching (though not as well as a normal
    // SHA, since it will change even if the individual file itself
    // doesn't.)
    ...(file.commit && file.commit.hash ? { id: this.getFileId(file.commit.hash, file.path) } : {}),
  });
  processFiles = (files: BitBucketFile[]) => files.filter(this.isFile).map(this.processFile);

  readFile = async (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch, head = '' } = {},
  ): Promise<string | Blob> => {
    const fetchContent = async () => {
      const node = head ? head : await this.branchCommitSha(branch);
      const content = await this.request({
        url: `${this.repoURL}/src/${node}/${path}`,
        cache: 'no-store',
      }).then<string | Blob>(parseText ? this.responseToText : this.responseToBlob);
      return content;
    };
    const content = await readFile(sha, fetchContent, localForage, parseText);
    return content;
  };

  async readFileMetadata(path: string, sha: string | null | undefined) {
    const fetchFileMetadata = async () => {
      try {
        const { values }: { values: BitBucketCommit[] } = await this.requestJSON({
          url: `${this.repoURL}/commits`,
          params: { path, include: this.branch },
        });
        const commit = values[0];
        return {
          author: commit.author.user
            ? commit.author.user.display_name || commit.author.user.nickname
            : commit.author.raw,
          updatedOn: commit.date,
        };
      } catch (e) {
        return { author: '', updatedOn: '' };
      }
    };
    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  async isShaExistsInBranch(branch: string, sha: string) {
    const { values }: { values: BitBucketCommit[] } = await this.requestJSON({
      url: `${this.repoURL}/commits`,
      params: { include: branch, pagelen: 100 },
    }).catch(e => {
      console.log(`Failed getting commits for branch '${branch}'`, e);
      return [];
    });

    return values.some(v => v.hash === sha);
  }

  getEntriesAndCursor = (jsonResponse: BitBucketSrcResult) => {
    const {
      size: count,
      page,
      pagelen: pageSize,
      next,
      previous: prev,
      values: entries,
    } = jsonResponse;
    const pageCount = pageSize && count ? Math.ceil(count / pageSize) : undefined;
    return {
      entries,
      cursor: Cursor.create({
        actions: [...(next ? ['next'] : []), ...(prev ? ['prev'] : [])],
        meta: { page, count, pageSize, pageCount },
        data: { links: { next, prev } },
      }),
    };
  };

  listFiles = async (path: string, depth = 1, pagelen: number, branch: string) => {
    const node = await this.branchCommitSha(branch);
    const result: BitBucketSrcResult = await this.requestJSON({
      url: `${this.repoURL}/src/${node}/${path}`,
      params: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        max_depth: depth,
        pagelen,
      },
    }).catch(replace404WithEmptyResponse);
    const { entries, cursor } = this.getEntriesAndCursor(result);

    return { entries: this.processFiles(entries), cursor: cursor as Cursor };
  };

  traverseCursor = async (
    cursor: Cursor,
    action: string,
  ): Promise<{
    cursor: Cursor;
    entries: { path: string; name: string; type: string; id: string }[];
  }> =>
    flow([
      this.requestJSON,
      then(this.getEntriesAndCursor),
      then<
        { cursor: Cursor; entries: BitBucketFile[] },
        { cursor: Cursor; entries: BitBucketFile[] }
      >(({ cursor: newCursor, entries }) => ({
        cursor: newCursor,
        entries: this.processFiles(entries),
      })),
    ])(cursor.data!.getIn(['links', action]));

  listAllFiles = async (path: string, depth: number, branch: string) => {
    const { cursor: initialCursor, entries: initialEntries } = await this.listFiles(
      path,
      depth,
      100,
      branch,
    );
    const entries = [...initialEntries];
    let currentCursor = initialCursor;
    while (currentCursor && currentCursor.actions!.has('next')) {
      const { cursor: newCursor, entries: newEntries } = await this.traverseCursor(
        currentCursor,
        'next',
      );
      entries.push(...newEntries);
      currentCursor = newCursor;
    }
    return this.processFiles(entries);
  };

  async uploadFiles(
    files: { path: string; newPath?: string; delete?: boolean }[],
    {
      commitMessage,
      branch,
      parentSha,
    }: { commitMessage: string; branch: string; parentSha?: string },
  ) {
    const formData = new FormData();
    const toMove: { from: string; to: string; contentBlob: Blob }[] = [];
    files.forEach(file => {
      if (file.delete) {
        // delete the file
        formData.append('files', file.path);
      } else if (file.newPath) {
        const contentBlob = get(file, 'fileObj', new Blob([(file as Entry).raw]));
        toMove.push({ from: file.path, to: file.newPath, contentBlob });
      } else {
        // add/modify the file
        const contentBlob = get(file, 'fileObj', new Blob([(file as Entry).raw]));
        // Third param is filename header, in case path is `message`, `branch`, etc.
        formData.append(file.path, contentBlob, basename(file.path));
      }
    });
    for (const { from, to, contentBlob } of toMove) {
      const sourceDir = dirname(from);
      const destDir = dirname(to);
      const filesBranch = parentSha ? this.branch : branch;
      const files = await this.listAllFiles(sourceDir, 100, filesBranch);
      for (const file of files) {
        // to move a file in Bitbucket we need to delete the old path
        // and upload the file content to the new path
        // NOTE: this is very wasteful, and also the Bitbucket `diff` API
        // reports these files as deleted+added instead of renamed
        // delete current path
        formData.append('files', file.path);
        // create in new path
        const content =
          file.path === from
            ? contentBlob
            : await this.readFile(file.path, null, {
                branch: filesBranch,
                parseText: false,
              });
        formData.append(file.path.replace(sourceDir, destDir), content, basename(file.path));
      }
    }

    if (commitMessage) {
      formData.append('message', commitMessage);
    }
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      formData.append('author', `${name} <${email}>`);
    }

    formData.append('branch', branch);

    if (parentSha) {
      formData.append('parents', parentSha);
    }

    try {
      await this.requestText({
        url: `${this.repoURL}/src`,
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      const message = error.message || '';
      // very descriptive message from Bitbucket
      if (parentSha && message.includes('Something went wrong')) {
        await throwOnConflictingBranches(branch, name => this.getBranch(name), API_NAME);
      }
      throw error;
    }

    return files;
  }

  async persistFiles(entry: Entry | null, mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = entry ? [entry, ...mediaFiles] : mediaFiles;
    if (options.useWorkflow) {
      return this.editorialWorkflowGit(files, entry as Entry, options);
    } else {
      return this.uploadFiles(files, { commitMessage: options.commitMessage, branch: this.branch });
    }
  }

  async addPullRequestComment(pullRequest: BitBucketPullRequest, comment: string) {
    await this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/pullrequests/${pullRequest.id}/comments`,
      headers: { 'Content-Type': APPLICATION_JSON },
      body: JSON.stringify({
        content: {
          raw: comment,
        },
      }),
    });
  }

  async getPullRequestLabel(id: number) {
    const comments: BitBucketPullComments = await this.requestJSON({
      url: `${this.repoURL}/pullrequests/${id}/comments`,
      params: {
        pagelen: 100,
      },
    });
    return comments.values.map(c => c.content.raw)[comments.values.length - 1];
  }

  async createPullRequest(branch: string, commitMessage: string, status: string) {
    const pullRequest: BitBucketPullRequest = await this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/pullrequests`,
      headers: { 'Content-Type': APPLICATION_JSON },
      body: JSON.stringify({
        title: commitMessage,
        source: {
          branch: {
            name: branch,
          },
        },
        destination: {
          branch: {
            name: this.branch,
          },
        },
        description: DEFAULT_PR_BODY,
        // eslint-disable-next-line @typescript-eslint/camelcase
        close_source_branch: true,
      }),
    });
    // use comments for status labels
    await this.addPullRequestComment(pullRequest, statusToLabel(status, this.cmsLabelPrefix));
  }

  async getDifferences(source: string, destination: string = this.branch) {
    if (source === destination) {
      return [];
    }
    const rawDiff = await this.requestText({
      url: `${this.repoURL}/diff/${source}..${destination}`,
      params: {
        binary: false,
      },
    });

    const diffs = parse(rawDiff).map(d => {
      const oldPath = d.oldPath?.replace(/b\//, '') || '';
      const newPath = d.newPath?.replace(/b\//, '') || '';
      const path = newPath || (oldPath as string);
      return {
        oldPath,
        newPath,
        status: d.status,
        newFile: d.status === 'added',
        path,
        binary: d.binary || /.svg$/.test(path),
      };
    });
    return diffs;
  }

  async editorialWorkflowGit(files: (Entry | AssetProxy)[], entry: Entry, options: PersistOptions) {
    const contentKey = generateContentKey(options.collectionName as string, entry.slug);
    const branch = branchFromContentKey(contentKey);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      const defaultBranchSha = await this.branchCommitSha(this.branch);
      await this.uploadFiles(files, {
        commitMessage: options.commitMessage,
        branch,
        parentSha: defaultBranchSha,
      });
      await this.createPullRequest(
        branch,
        options.commitMessage,
        options.status || this.initialWorkflowStatus,
      );
    } else {
      // mark files for deletion
      const diffs = await this.getDifferences(branch);
      const toDelete: DeleteEntry[] = [];
      for (const diff of diffs.filter(d => d.binary && d.status !== 'deleted')) {
        if (!files.some(file => file.path === diff.path)) {
          toDelete.push({ path: diff.path, delete: true });
        }
      }

      await this.uploadFiles([...files, ...toDelete], {
        commitMessage: options.commitMessage,
        branch,
      });
    }
  }

  deleteFile = (path: string, message: string) => {
    const body = new FormData();
    body.append('files', path);
    body.append('branch', this.branch);
    if (message) {
      body.append('message', message);
    }
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      body.append('author', `${name} <${email}>`);
    }
    return flow([unsentRequest.withMethod('POST'), unsentRequest.withBody(body), this.request])(
      `${this.repoURL}/src`,
    );
  };

  async getPullRequests(sourceBranch?: string) {
    const sourceQuery = sourceBranch
      ? `source.branch.name = "${sourceBranch}"`
      : `source.branch.name ~ "${CMS_BRANCH_PREFIX}/"`;

    const pullRequests: BitBucketPullRequests = await this.requestJSON({
      url: `${this.repoURL}/pullrequests`,
      params: {
        pagelen: 50,
        q: oneLine`
        source.repository.full_name = "${this.repo}" 
        AND state = "${BitBucketPullRequestState.OPEN}" 
        AND destination.branch.name = "${this.branch}"
        AND comment_count > 0
        AND ${sourceQuery}
        `,
      },
    });

    const labels = await Promise.all(
      pullRequests.values.map(pr => this.getPullRequestLabel(pr.id)),
    );

    return pullRequests.values.filter((_, index) => isCMSLabel(labels[index], this.cmsLabelPrefix));
  }

  async getBranchPullRequest(branch: string) {
    const pullRequests = await this.getPullRequests(branch);
    if (pullRequests.length <= 0) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }

    return pullRequests[0];
  }

  async listUnpublishedBranches() {
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );

    const pullRequests = await this.getPullRequests();
    const branches = pullRequests.map(mr => mr.source.branch.name);

    return branches;
  }

  async retrieveUnpublishedEntryData(contentKey: string) {
    const { collection, slug } = parseContentKey(contentKey);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const diffs = await this.getDifferences(branch);
    const label = await this.getPullRequestLabel(pullRequest.id);
    const status = labelToStatus(label, this.cmsLabelPrefix);
    const updatedAt = pullRequest.updated_on;
    return {
      collection,
      slug,
      status,
      // TODO: get real id
      diffs: diffs
        .filter(d => d.status !== 'deleted')
        .map(d => ({ path: d.path, newFile: d.newFile, id: '' })),
      updatedAt,
    };
  }

  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    await this.addPullRequestComment(pullRequest, statusToLabel(newStatus, this.cmsLabelPrefix));
  }

  async mergePullRequest(pullRequest: BitBucketPullRequest) {
    await this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/pullrequests/${pullRequest.id}/merge`,
      headers: { 'Content-Type': APPLICATION_JSON },
      body: JSON.stringify({
        message: MERGE_COMMIT_MESSAGE,
        // eslint-disable-next-line @typescript-eslint/camelcase
        close_source_branch: true,
        // eslint-disable-next-line @typescript-eslint/camelcase
        merge_strategy: this.mergeStrategy,
      }),
    });
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    await this.mergePullRequest(pullRequest);
  }

  async declinePullRequest(pullRequest: BitBucketPullRequest) {
    await this.requestJSON({
      method: 'POST',
      url: `${this.repoURL}/pullrequests/${pullRequest.id}/decline`,
    });
  }

  async deleteBranch(branch: string) {
    await this.request({
      method: 'DELETE',
      url: `${this.repoURL}/refs/branches/${branch}`,
    });
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    await this.declinePullRequest(pullRequest);
    await this.deleteBranch(branch);
  }

  async getPullRequestStatuses(pullRequest: BitBucketPullRequest) {
    const statuses: BitBucketPullRequestStatues = await this.requestJSON({
      url: `${this.repoURL}/pullrequests/${pullRequest.id}/statuses`,
      params: {
        pagelen: 100,
      },
    });

    return statuses.values;
  }

  async getStatuses(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const statuses = await this.getPullRequestStatuses(pullRequest);

    return statuses.map(({ key, state, url }) => ({
      context: key,
      state:
        state === BitBucketPullRequestStatusState.Successful
          ? PreviewState.Success
          : PreviewState.Other,
      // eslint-disable-next-line @typescript-eslint/camelcase
      target_url: url,
    }));
  }

  async getUnpublishedEntrySha(collection: string, slug: string) {
    const contentKey = generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    return pullRequest.destination.commit.hash;
  }
}
