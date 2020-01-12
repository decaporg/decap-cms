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
} from 'netlify-cms-lib-util';
import { oneLine } from 'common-tags';

interface Config {
  apiRoot?: string;
  token?: string;
  branch?: string;
  repo?: string;
  requestFunction?: (req: ApiRequest) => Promise<Response>;
  hasWriteAccess?: () => Promise<boolean>;
  squashMerges: boolean;
  initialWorkflowStatus: string;
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

type BitBucketDiffStat = {
  pagelen: number;
  page: number;
  size: number;
  values: {
    status: string;
    lines_removed: number;
    lines_added: number;
    new: {
      path: string;
      type: 'commit_file';
    };
  }[];
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

export const API_NAME = 'BitBucket';

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
  }

  buildRequest = (req: ApiRequest) =>
    flow([unsentRequest.withRoot(this.apiRoot), unsentRequest.withTimestamp])(req);

  request = (req: ApiRequest): Promise<Response> =>
    flow([
      this.buildRequest,
      this.requestFunction,
      p => p.catch((err: Error) => Promise.reject(new APIError(err.message, null, API_NAME))),
    ])(req);

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

  branchCommitSha = async (branch: string) => {
    const {
      target: { hash: branchSha },
    } = await this.requestJSON(`${this.repoURL}/refs/branches/${branch}`);
    return branchSha as string;
  };

  isFile = ({ type }: BitBucketFile) => type === 'commit_file';
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
    ...(file.commit && file.commit.hash ? { id: `${file.commit.hash}/${file.path}` } : {}),
  });
  processFiles = (files: BitBucketFile[]) => files.filter(this.isFile).map(this.processFile);

  readFile = async (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch } = {},
  ): Promise<string | Blob> => {
    const fetchContent = async () => {
      const node = await this.branchCommitSha(branch);
      const content = await this.request({
        url: `${this.repoURL}/src/${node}/${path}`,
        cache: 'no-store',
      }).then<string | Blob>(parseText ? this.responseToText : this.responseToBlob);
      return content;
    };
    const content = await readFile(sha, fetchContent, localForage, parseText);
    return content;
  };

  getEntriesAndCursor = (jsonResponse: BitBucketSrcResult) => {
    const {
      size: count,
      page: index,
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
        meta: { index, count, pageSize, pageCount },
        data: { links: { next, prev } },
      }),
    };
  };

  listFiles = async (path: string, depth = 1) => {
    const node = await this.branchCommitSha(this.branch);
    const result: BitBucketSrcResult = await this.requestJSON({
      url: `${this.repoURL}/src/${node}/${path}`,
      params: {
        // sort files by filename ascending
        sort: '-path',
        // eslint-disable-next-line @typescript-eslint/camelcase
        max_depth: depth,
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

  listAllFiles = async (path: string, depth = 1) => {
    const { cursor: initialCursor, entries: initialEntries } = await this.listFiles(path, depth);
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
    files: (Entry | AssetProxy | DeleteEntry)[],
    {
      commitMessage,
      branch,
      parentSha,
    }: { commitMessage: string; branch: string; parentSha?: string },
  ) {
    const formData = new FormData();
    files.forEach(file => {
      if ((file as DeleteEntry).delete) {
        // delete the file
        formData.append('files', file.path);
      } else {
        // add/modify the file
        const contentBlob = get(file, 'fileObj', new Blob([(file as Entry).raw]));
        // Third param is filename header, in case path is `message`, `branch`, etc.
        formData.append(file.path, contentBlob, basename(file.path));
      }
    });
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

    await this.request({
      url: `${this.repoURL}/src`,
      method: 'POST',
      body: formData,
    });

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
    await this.addPullRequestComment(pullRequest, statusToLabel(status));
  }

  async getDifferences(branch: string) {
    const diff: BitBucketDiffStat = await this.requestJSON({
      url: `${this.repoURL}/diffstat/${branch}..${this.branch}`,
      params: {
        pagelen: 100,
      },
    });
    return diff.values;
  }

  async editorialWorkflowGit(files: (Entry | AssetProxy)[], entry: Entry, options: PersistOptions) {
    const contentKey = this.generateContentKey(options.collectionName as string, entry.slug);
    const branch = this.branchFromContentKey(contentKey);
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
      for (const diff of diffs) {
        if (!files.some(file => file.path === diff.new.path)) {
          toDelete.push({ path: diff.new.path, delete: true });
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

  generateContentKey(collectionName: string, slug: string) {
    return generateContentKey(collectionName, slug);
  }

  contentKeyFromBranch(branch: string) {
    return branch.substring(`${CMS_BRANCH_PREFIX}/`.length);
  }

  branchFromContentKey(contentKey: string) {
    return `${CMS_BRANCH_PREFIX}/${contentKey}`;
  }

  async isFileExists(path: string, branch: string) {
    const fileExists = await this.readFile(path, null, { branch })
      .then(() => true)
      .catch(error => {
        if (error instanceof APIError && error.status === 404) {
          return false;
        }
        throw error;
      });

    return fileExists;
  }

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

    return pullRequests.values.filter((_, index) => isCMSLabel(labels[index]));
  }

  async getBranchPullRequest(branch: string) {
    const pullRequests = await this.getPullRequests(branch);
    if (pullRequests.length <= 0) {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    }

    return pullRequests[0];
  }

  async retrieveMetadata(contentKey: string) {
    const { collection, slug } = parseContentKey(contentKey);
    const branch = this.branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const diff = await this.getDifferences(branch);
    const path = diff.find(d => d.new.path.includes(slug))?.new.path as string;
    // TODO: get real file id
    const mediaFiles = await Promise.all(
      diff.filter(d => d.new.path !== path).map(d => ({ path: d.new.path, id: null })),
    );
    const label = await this.getPullRequestLabel(pullRequest.id);
    const status = labelToStatus(label);
    return { branch, collection, slug, path, status, mediaFiles };
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

  async listUnpublishedBranches() {
    console.log(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );

    const pullRequests = await this.getPullRequests();
    const branches = pullRequests.map(mr => mr.source.branch.name);

    return branches;
  }

  async updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    const contentKey = this.generateContentKey(collection, slug);
    const branch = this.branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    await this.addPullRequestComment(pullRequest, statusToLabel(newStatus));
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
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
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
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
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
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = this.branchFromContentKey(contentKey);
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
}
