// From the package root, not `.../src/API`: jest's moduleNameMapper maps the
// deep path to the index, and this class would extend `undefined` under test.
import { API } from 'decap-cms-backend-github';
import { branchFromContentKey, DEFAULT_PR_BODY } from 'decap-cms-lib-util';

import type { AssetProxy, DataFile, PersistOptions } from 'decap-cms-lib-util';

/** Matches the REST path's result, so this stays a drop-in subclass. */
type PersistFilesResult = Awaited<ReturnType<API['persistFiles']>>;
type DeleteFilesResult = Awaited<ReturnType<API['deleteFiles']>>;

// Derived rather than imported from `decap-cms-backend-github/src/API`: the
// published package ships that directory as TypeScript source, which no
// consumer's bundler is configured to resolve.
type GitHubAPIConfig = ConstructorParameters<typeof API>[0];

type TurboAPIConfig = GitHubAPIConfig & {
  /** The backend's scoped fetch: token, x-site-id scoping, refresh, save meter. */
  turboFetch: (url: string, init?: RequestInit) => Promise<Response>;
};

interface CommitFile {
  path: string;
  raw?: string;
  newPath?: string;
  toBase64?: () => Promise<string>;
}

/**
 * Statuses that prove the server did NOT commit, and so are safe to retry on
 * the REST path:
 *
 * - 404: the deployed edge function predates this endpoint. Falling back keeps
 *   a CMS bundle safe to ship before the server side is live.
 * - 413: the payload exceeded the endpoint's ceiling, rejected during
 *   validation before any GitHub call.
 * - 400: rejected by request validation, also before any GitHub call. This is
 *   what makes the two repos safe to deploy in either order: a request shape
 *   the deployed function does not understand yet saves over REST instead.
 *
 * Nothing else falls back. A network error or a 5xx could mean the commit
 * landed and the response was lost, and retrying that would double-commit.
 */
const FALLBACK_STATUSES = new Set([400, 404, 413]);

/**
 * GitHub API client that commits through Turbo's `_content/commit` endpoint in
 * one request, instead of the REST blob/tree/commit/ref sequence's `N + 4`.
 */
export default class TurboAPI extends API {
  turboFetch: TurboAPIConfig['turboFetch'];

  constructor(config: TurboAPIConfig) {
    super(config);
    this.turboFetch = config.turboFetch;
  }

  get commitEndpoint() {
    return `${this.apiRoot}/_content/commit`;
  }

  /**
   * Renames stay on REST: Decap moves sibling files by blob sha, and
   * `_content/commit` takes contents, not shas.
   *
   * Editorial workflow: only a FIRST save, the one that puts an entry into
   * review. Re-saving an unpublished entry rebases its branch and computes the
   * media to drop from a client-side diff, which is not a plain commit.
   */
  private canCommitViaTurbo(dataFiles: DataFile[], options: PersistOptions) {
    if (!this.turboFetch) {
      return false;
    }
    if (dataFiles.some(file => (file as CommitFile).newPath)) {
      return false;
    }
    if (options.useWorkflow) {
      return !options.unpublished;
    }
    return true;
  }

  /** The entry's workflow branch by Decap's own rule, so server and client agree. */
  private workflowBranchFor(options: PersistOptions, slug: string) {
    return branchFromContentKey(this.generateContentKey(options.collectionName as string, slug));
  }

  /**
   * Finishes a workflow save whose commit landed but whose pull request or
   * label did not. Never re-runs the commit, which would add a duplicate.
   */
  private async finishWorkflowOverRest(
    branch: string,
    slug: string,
    options: PersistOptions,
    pullRequestNumber: number | null,
  ) {
    console.warn(
      'Turbo committed the entry but could not put it into review; finishing over REST.',
    );

    if (!pullRequestNumber) {
      await this.createPR(options.commitMessage, branch);
    }

    // Re-reads the pull request so its non-CMS labels survive the status
    // change, which is why this is not a bare updatePullRequestLabels.
    await this.updateUnpublishedEntryStatus(
      options.collectionName as string,
      slug,
      options.status || this.initialWorkflowStatus,
    );
  }

  /**
   * `asset` keeps media out of the content cache; only the client knows the
   * data-file / asset split. Cache bookkeeping only: the server checks
   * permissions on every path regardless.
   */
  private async toCommitAddition(file: CommitFile, asset: boolean) {
    const contents =
      typeof file.toBase64 === 'function'
        ? await file.toBase64()
        : await this.toBase64(file.raw as string);

    return { path: file.path.replace(/^\/+/, ''), contents, ...(asset && { asset: true }) };
  }

  private async turboCommit(body: Record<string, unknown>) {
    const response = await this.turboFetch(this.commitEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return (await response.json()) as {
      sha: string;
      url: string;
      branch: string;
      workflow?: { complete: boolean; pull_request: { number: number; url?: string } | null };
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private shouldFallBack(error: any) {
    return FALLBACK_STATUSES.has(error?.status);
  }

  async persistFiles(
    dataFiles: DataFile[],
    mediaFiles: AssetProxy[],
    options: PersistOptions,
  ): Promise<PersistFilesResult> {
    if (!this.canCommitViaTurbo(dataFiles, options)) {
      return super.persistFiles(dataFiles, mediaFiles, options);
    }

    // Media first, matching the REST path's order.
    try {
      const additions = await Promise.all([
        ...(mediaFiles as unknown as CommitFile[]).map(file => this.toCommitAddition(file, true)),
        ...(dataFiles as unknown as CommitFile[]).map(file => this.toCommitAddition(file, false)),
      ]);

      // A workflow save targets the entry's own branch; the server opens the
      // pull request and applies the status label in the same call.
      const slug = dataFiles[0]?.slug as string | undefined;
      const workflowBranch =
        options.useWorkflow && slug ? this.workflowBranchFor(options, slug) : null;

      const commit = await this.turboCommit({
        branch: workflowBranch ?? this.branch,
        // The branch this deploy edits, which the server cannot infer: one site
        // can serve several deploys of a repo, and without it a staging draft
        // forked from production.
        base: this.branch,
        ...(workflowBranch && {
          workflow: {
            status: options.status || this.initialWorkflowStatus,
            label_prefix: this.cmsLabelPrefix || undefined,
            pull_request_title: options.commitMessage,
            pull_request_body: DEFAULT_PR_BODY,
          },
        }),
        message: options.commitMessage,
        additions,
        // Descriptive only: what the Deploys page shows in place of a bare sha.
        entry_label: (options as { entryLabel?: string }).entryLabel,
        entry_path: (options as { entryPath?: string }).entryPath,
      });

      // The commit has landed by this point. If the pull request or the label
      // did not, the entry exists on its branch but is not in review, so the
      // remaining steps are redone over REST — never the commit itself.
      if (workflowBranch && slug && commit.workflow && !commit.workflow.complete) {
        await this.finishWorkflowOverRest(
          workflowBranch,
          slug,
          options,
          commit.workflow.pull_request?.number ?? null,
        );
      }

      return commit as unknown as PersistFilesResult;
    } catch (error) {
      if (this.shouldFallBack(error)) {
        return super.persistFiles(dataFiles, mediaFiles, options);
      }
      throw error;
    }
  }

  async deleteFiles(paths: string[], message: string): Promise<DeleteFilesResult> {
    if (!this.turboFetch) {
      return super.deleteFiles(paths, message);
    }

    try {
      await this.turboCommit({
        branch: this.branch,
        message,
        deletions: paths.map(path => path.replace(/^\/+/, '')),
      });
      return undefined;
    } catch (error) {
      if (this.shouldFallBack(error)) {
        return super.deleteFiles(paths, message);
      }
      throw error;
    }
  }
}
