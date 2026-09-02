// Imported from the package root, not `decap-cms-backend-github/src/API`:
// jest's moduleNameMapper rewrites any path containing the package name to its
// index, so the deep path resolves to the index's (nonexistent) default export
// and this class would extend `undefined` under test. The type-only import
// below is erased before that mapping ever applies.
import { API } from 'decap-cms-backend-github';
import { branchFromContentKey, DEFAULT_PR_BODY } from 'decap-cms-lib-util';

import type { Config as GitHubAPIConfig } from 'decap-cms-backend-github/src/API';
import type { AssetProxy, DataFile, PersistOptions } from 'decap-cms-lib-util';

/** Whatever the REST path resolves to — callers only test it for truthiness,
 *  but matching it keeps this a drop-in subclass rather than a lookalike. */
type PersistFilesResult = Awaited<ReturnType<API['persistFiles']>>;
type DeleteFilesResult = Awaited<ReturnType<API['deleteFiles']>>;

/**
 * GitHub API client that commits through Turbo's `_content/commit` endpoint
 * instead of the REST blob/tree/commit/ref sequence.
 *
 * The REST sequence is `N + 4` requests — one blob upload per file, then a
 * branch read, a tree, a commit and a ref update — and through Turbo every one
 * of them is a full browser -> edge -> GitHub round trip that re-pays the
 * proxy's auth/scope/quota preamble. The endpoint collapses that to a single
 * request, and server-side to a single GitHub GraphQL call.
 *
 * See decap-turbo/docs/deploy-status-plan.md §B1.
 */

type TurboAPIConfig = GitHubAPIConfig & {
  /** The backend's own scoped fetch — carries the Supabase bearer token, the
   *  x-site-id scoping and the session refresh, and feeds the save meter. */
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
 * - 400: rejected by request validation, which runs before any GitHub call for
 *   the same reason 413 does. This is what makes the two repos safe to deploy
 *   in either order: a bundle that sends a request shape the deployed edge
 *   function does not understand yet — an editorial-workflow commit, say —
 *   saves over REST instead of failing in front of the editor.
 *
 * Nothing else falls back. A network error or a 5xx could mean the commit
 * landed and the response was lost, and retrying that would double-commit.
 */
const FALLBACK_STATUSES = new Set([400, 404, 413]);

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
   * Renames are deliberately excluded. Decap expresses a rename as a directory
   * move (`updateTree`'s `toMove`), which relocates every sibling file by blob
   * sha without ever holding their contents — and `_content/commit` takes
   * contents, not shas, so the move is simply not expressible. The REST path
   * handles it correctly, and a rename is rare enough that paying `N + 4` for
   * it costs nothing in aggregate.
   *
   * Editorial workflow: only a FIRST save, the one that puts an entry into
   * review. Saving an entry that is already unpublished rebases its branch
   * against the site branch and computes which media to drop, from a diff the
   * client reads — that is a different operation, not a commit with extra
   * steps, so it stays on the REST path. Open authoring likewise: it creates a
   * branch with no pull request at all, and commits from a fork.
   */
  private canCommitViaTurbo(dataFiles: DataFile[], options: PersistOptions) {
    if (!this.turboFetch) {
      return false;
    }
    if (dataFiles.some(file => (file as CommitFile).newPath)) {
      return false;
    }
    if (options.useWorkflow) {
      return !options.unpublished && !this.useOpenAuthoring;
    }
    return true;
  }

  /**
   * The entry's own editorial-workflow branch, by the same rule Decap uses
   * everywhere else, so the server's branch and the client's agree.
   */
  private workflowBranchFor(options: PersistOptions, slug: string) {
    return branchFromContentKey(this.generateContentKey(options.collectionName as string, slug));
  }

  /**
   * Finishes an editorial-workflow save whose commit landed but whose pull
   * request or label did not.
   *
   * Deliberately does NOT re-run the commit: it is already in the branch, and
   * falling back to `super.persistFiles` here would upload every blob again
   * and add a second, identical commit. Only the missing steps are redone, on
   * the REST path that has always done them.
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
   * `asset` tells the server to keep this file out of the content cache — media
   * is served by the media library, and a base64 image stored as cache text
   * would bloat it for a row nothing reads. Only the client knows the split:
   * it is the data-file / asset-proxy distinction Decap already draws, and the
   * server cannot re-derive it (collection keys are opaque to it).
   *
   * Cache bookkeeping only. The server checks permissions on every path in the
   * commit regardless of this flag.
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

    // Media first, matching the REST path's `mediaFiles.concat(dataFiles)` —
    // one commit either way, but keeping the order identical means a reviewer
    // comparing the two paths sees the same tree.
    try {
      const additions = await Promise.all([
        ...(mediaFiles as unknown as CommitFile[]).map(file => this.toCommitAddition(file, true)),
        ...(dataFiles as unknown as CommitFile[]).map(file => this.toCommitAddition(file, false)),
      ]);

      // An editorial-workflow save targets the entry's own branch and asks the
      // server to open the pull request and apply the status label as part of
      // the same call. That replaces six further round trips — a branch read, a
      // tree, a commit, a ref, a pull request and a label — each of which was
      // re-paying the proxy's preamble.
      const slug = dataFiles[0]?.slug as string | undefined;
      const workflowBranch =
        options.useWorkflow && slug ? this.workflowBranchFor(options, slug) : null;

      const commit = await this.turboCommit({
        branch: workflowBranch ?? this.branch,
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
        // Descriptive only — nothing about the commit depends on it. It is
        // what the Deploys page shows in place of a bare sha, for every
        // editor rather than only the browser that saved.
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
    if (!this.turboFetch || this.useOpenAuthoring) {
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
