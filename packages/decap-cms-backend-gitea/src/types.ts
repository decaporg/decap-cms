export type GiteaUser = {
  active: boolean;
  avatar_url: string;
  created: string;
  description: string;
  email: string;
  followers_count: number;
  following_count: number;
  full_name: string;
  id: number;
  is_admin: boolean;
  language: string;
  last_login: string;
  location: string;
  login: string;
  login_name?: string;
  prohibit_login: boolean;
  restricted: boolean;
  starred_repos_count: number;
  visibility: string;
  website: string;
};

export type GiteaTeam = {
  can_create_org_repo: boolean;
  description: string;
  id: number;
  includes_all_repositories: boolean;
  name: string;
  organization: GiteaOrganization;
  permission: string;
  units: Array<string>;
  units_map: Map<string, string>;
};

export type GiteaOrganization = {
  avatar_url: string;
  description: string;
  full_name: string;
  id: number;
  location: string;
  name: string;
  repo_admin_change_team_access: boolean;
  username: string;
  visibility: string;
  website: string;
};

type CommitUser = {
  date: string;
  email: string;
  name: string;
};

type CommitMeta = {
  created: string;
  sha: string;
  url: string;
};

type PayloadUser = {
  email: string;
  name: string;
  username: string;
};

type PayloadCommitVerification = {
  payload: string;
  reason: string;
  signature: string;
  signer: PayloadUser;
  verified: boolean;
};

type ReposListCommitsResponseItemCommit = {
  author: CommitUser;
  committer: CommitUser;
  message: string;
  tree: CommitMeta;
  url: string;
  verification: PayloadCommitVerification;
};

type GiteaRepositoryPermissions = {
  admin: boolean;
  pull: boolean;
  push: boolean;
};

type GiteaRepositoryExternalTracker = {
  external_tracker_format: string;
  external_tracker_regexp_pattern: string;
  external_tracker_style: string;
  external_tracker_url: string;
};

type GiteaRepositoryExternalWiki = {
  external_wiki_url: string;
};

type GiteaRepositoryInternalTracker = {
  allow_only_contributors_to_track_time: boolean;
  enable_issue_dependencies: boolean;
  enable_time_tracker: boolean;
};

type GiteaRepositoryRepoTransfer = {
  description: string;
  doer: GiteaUser;
  recipient: GiteaUser;
  teams: Array<GiteaTeam>;
  enable_issue_dependencies: boolean;
  enable_time_tracker: boolean;
};

export type GiteaRepository = {
  allow_merge_commits: boolean;
  allow_rebase: boolean;
  allow_rebase_explicit: boolean;
  allow_rebase_update: boolean;
  allow_squash_merge: boolean;
  archived: boolean;
  avatar_url: string;
  clone_url: string;
  created_at: string;
  default_branch: string;
  default_delete_branch_after_merge: boolean;
  default_merge_style: boolean;
  description: string;
  empty: boolean;
  external_tracker: GiteaRepositoryExternalTracker;
  external_wiki: GiteaRepositoryExternalWiki;
  fork: boolean;
  forks_count: number;
  full_name: string;
  has_issues: boolean;
  has_projects: boolean;
  has_pull_requests: boolean;
  has_wiki: boolean;
  html_url: string;
  id: number;
  ignore_whitespace_conflicts: boolean;
  internal: boolean;
  internal_tracker: GiteaRepositoryInternalTracker;
  language: string;
  languages_url: string;
  mirror: boolean;
  mirror_interval: string;
  mirror_updated: string;
  name: string;
  open_issues_count: number;
  open_pr_counter: number;
  original_url: string;
  owner: GiteaUser;
  parent: null;
  permissions: GiteaRepositoryPermissions;
  private: boolean;
  release_counter: number;
  repo_transfer: GiteaRepositoryRepoTransfer;
  size: number;
  ssh_url: string;
  stars_count: number;
  template: boolean;
  updated_at: string;
  watchers_count: number;
  website: string;
};

type ReposListCommitsResponseItemCommitAffectedFiles = {
  filename: string;
};

type ReposListCommitsResponseItemCommitStats = {
  additions: number;
  deletions: number;
  total: number;
};

type ReposListCommitsResponseItem = {
  author: GiteaUser;
  commit: ReposListCommitsResponseItemCommit;
  committer: GiteaUser;
  created: string;
  files: Array<ReposListCommitsResponseItemCommitAffectedFiles>;
  html_url: string;
  parents: Array<CommitMeta>;
  sha: string;
  stats: ReposListCommitsResponseItemCommitStats;
  url: string;
};

export type ReposListCommitsResponse = Array<ReposListCommitsResponseItem>;

export type GitGetBlobResponse = {
  content: string;
  encoding: string;
  sha: string;
  size: number;
  url: string;
};

type GitGetTreeResponseTreeItem = {
  mode: string;
  path: string;
  sha: string;
  size?: number;
  type: string;
  url: string;
};

export type GitGetTreeResponse = {
  page: number;
  sha: string;
  total_count: number;
  tree: Array<GitGetTreeResponseTreeItem>;
  truncated: boolean;
  url: string;
};

type FileLinksResponse = {
  git: string;
  html: string;
  self: string;
};

type ContentsResponse = {
  _links: FileLinksResponse;
  content?: string | null;
  download_url: string;
  encoding?: string | null;
  git_url: string;
  html_url: string;
  last_commit_sha: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  submodule_git_url?: string | null;
  target?: string | null;
  type: string;
  url: string;
};

type FileCommitResponse = {
  author: CommitUser;
  committer: CommitUser;
  created: string;
  html_url: string;
  message: string;
  parents: Array<CommitMeta>;
  sha: string;
  tree: CommitMeta;
  url: string;
};

export type FilesResponse = {
  commit: FileCommitResponse;
  content: Array<ContentsResponse>;
  verification: PayloadCommitVerification;
};
