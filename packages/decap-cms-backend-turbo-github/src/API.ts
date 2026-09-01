// Imported from the package root, not `decap-cms-backend-github/src/API`:
// jest's moduleNameMapper rewrites any path containing the package name to its
// index, so the deep path resolves to the index's (nonexistent) default export
// and this class would extend `undefined` under test. The type-only import
// below is erased before that mapping ever applies.
import { API } from 'decap-cms-backend-github';

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
 *
 * Nothing else falls back. A network error or a 5xx could mean the commit
 * landed and the response was lost, and retrying that would double-commit.
 */
const FALLBACK_STATUSES = new Set([404, 413]);

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
   */
  private canCommitViaTurbo(dataFiles: DataFile[], options: PersistOptions) {
    if (!this.turboFetch || options.useWorkflow) {
      return false;
    }
    return !dataFiles.some(file => (file as CommitFile).newPath);
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

    return (await response.json()) as { sha: string; url: string; branch: string };
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

      const commit = await this.turboCommit({
        branch: this.branch,
        message: options.commitMessage,
        additions,
      });

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
