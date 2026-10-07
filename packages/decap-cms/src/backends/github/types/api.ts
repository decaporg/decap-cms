import type {
  ApiRequest,
  CmsAssetProxy,
  CmsDataFile,
  CmsPersistOptions,
  FetchError,
  Semaphore,
} from '@/lib/util/index';
import type { Endpoints } from '@octokit/types';

export type GitHubUser = Endpoints['GET /user']['response']['data'];
export type GitCreateTreeParamsTree = Endpoints['POST /repos/{owner}/{repo}/git/trees']['request']['data']['tree'][0];
export type GitHubCompareCommit =
  Endpoints['GET /repos/{owner}/{repo}/compare/{base}...{head}']['response']['data']['commits'][0];
export type GitHubAuthor =
  & Omit<
    Endpoints['POST /repos/{owner}/{repo}/git/commits']['request']['data']['author'],
    'name' | 'email' | 'date'
  >
  & { name: string, email: string, date?: string };
export type GitHubCommitter =
  & Omit<
    Endpoints['POST /repos/{owner}/{repo}/git/commits']['request']['data']['committer'],
    'name' | 'email' | 'date'
  >
  & { name: string, email: string, date?: string };
export type GitHubPull =
  & Omit<
    Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][0],
    'labels'
  >
  & { labels: GitHubLabel[] };
export type GitHubLabel =
  & Omit<
    Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}']['response']['data']['labels'][0],
    'description'
  >
  & { description: string };

// The optional members are forwarded straight from `config.backend`, where an
// unset key reads as `undefined`; the constructor defaults each one. Hence
// `| undefined` rather than plain `?:` - "explicitly not configured" is a
// value callers pass, not a key they omit.
export interface Config {
  apiRoot?: string | undefined;
  token?: string | undefined;
  tokenKeyword?: string | undefined;
  branch?: string | undefined;
  useOpenAuthoring?: boolean | undefined;
  repo?: string | undefined;
  originRepo?: string | undefined;
  squashMerges: boolean;
  initialWorkflowStatus: string;
  cmsLabelPrefix: string;
  baseUrl?: string | undefined;
  getUser: ({ token }: { token: string }) => Promise<GitHubUser>;
}

export interface TreeFile {
  type: 'blob' | 'tree';
  sha: string;
  path: string;
  raw?: string;
}

export interface TreeFileForUpdate {
  sha: string | null;
  path: string;
}

export type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type TreeEntry = Override<GitCreateTreeParamsTree, { sha: string | null }>;

export type GitHubCompareCommits = GitHubCompareCommit[];

export type GitHubCompareFile =
  & NonNullable<
    Endpoints['GET /repos/{owner}/{repo}/compare/{base}...{head}']['response']['data']['files']
  >[0]
  & {
    previous_filename?: string,
  };

export type GitHubCompareFiles = GitHubCompareFile[];

export const GithubCommitStatusState = {
  Error: 'error',
  Failure: 'failure',
  Pending: 'pending',
  Success: 'success',
} as const;
export type GithubCommitStatusState = (typeof GithubCommitStatusState)[keyof typeof GithubCommitStatusState];

export const PullRequestState = {
  Open: 'open',
  Closed: 'closed',
  All: 'all',
} as const;
export type PullRequestState = (typeof PullRequestState)[keyof typeof PullRequestState];

export type GitHubCommitStatus =
  & Endpoints['GET /repos/{owner}/{repo}/commits/{ref}/statuses']['response']['data'][0]
  & {
    state: GithubCommitStatusState,
  };

export interface MetaDataObjects {
  entry: { path: string, sha: string };
  files: MediaFile[];
}

export interface Metadata {
  type: string;
  objects: MetaDataObjects;
  branch: string;
  status: string;
  pr?: {
    number: number,
    head: string | { sha: string },
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

export type Param = string | number | undefined;

export type Options = RequestInit & {
  params?: Record<string, Param | Record<string, Param> | string[]>,
};

export type MediaFile = {
  sha: string,
  path: string,
};

/** The account behind an issue or comment, as the notes code reads it. */
export interface GitHubIssueUser {
  login: string;
  avatar_url: string;
}

/** An entry's notes thread: a repository issue, one comment per note. */
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  comments: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GitHubIssueUser | null;
  labels: { name: string, color: string }[];
}

export interface GitHubIssueComment {
  id: number;
  body: string | null;
  user: GitHubIssueUser | null;
  created_at: string;
  updated_at: string;
}
