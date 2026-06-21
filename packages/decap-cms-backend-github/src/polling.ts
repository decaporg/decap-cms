/**
 * GitHub Notes Polling System
 *
 * ETag-based polling manager that efficiently checks for changes in GitHub Issues
 * Used for a real-time feel of notes updates without excessive API calls leveraging conditional requests (304) that don't count on Github rate limits.
 *
 * @module polling
 */

import type { Note, IssueState, CommentData, IssueChange } from 'decap-cms-lib-util';

interface WatchedIssue {
  issueNumber: number;
  collection: string;
  slug: string;
  etag: string | null;
  lastState: IssueState | null;
  onUpdate?: (notes: Note[], changes: IssueChange[]) => void;
  onChange?: (change: IssueChange) => void;
  retryCount?: number;
  maxRetries?: number;
}

export interface GitHubNotesAPI {
  getIssueState(issueNumber: number): Promise<IssueState>;
  getIssueWithETag(
    issueNumber: number,
    etag: string | null,
  ): Promise<
    | { status: 304; data?: never; etag?: never }
    | { status: 200; data: IssueState; etag: string | null }
  >;
  parseCommentToNote(comment: CommentData): Note;
  findEntryIssue(collection: string, slug: string): Promise<{ number: number } | null>;
}

// Redux action types
export const NOTES_POLLING_START = 'NOTES_POLLING_START';
export const NOTES_POLLING_STOP = 'NOTES_POLLING_STOP';
export const NOTES_POLLING_UPDATE = 'NOTES_POLLING_UPDATE';
export const NOTES_CHANGE_DETECTED = 'NOTES_CHANGE_DETECTED';

export class ETagPollingManager {
  private currentWatch: WatchedIssue | null = null;
  private currentIssueKey: string | null = null;
  private pollingInterval = 15000;
  private intervalId: NodeJS.Timeout | null = null;
  private isDocumentVisible = true;
  private api: GitHubNotesAPI;
  private isPolling = false;
  private pendingRetryTimeout: NodeJS.Timeout | null = null;

  constructor(api: GitHubNotesAPI, pollingInterval = 15000) {
    this.api = api;
    this.pollingInterval = pollingInterval;
    this.setupVisibilityListener();
  }

  /**
   * Setup Page Visibility API listener
   * Pauses polling when tab is hidden
   */
  private setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isDocumentVisible = !document.hidden;

        if (this.isDocumentVisible) {
          this.startPolling();
          this.checkAllIssuesNow();
        } else {
          this.stopPolling();
        }
      });
    }
  }

  /**
   * Start watching an issue for changes
   * This will automatically stop watching any previously watched issue
   *
   * @param issueNumber - GitHub issue number
   * @param collection - Collection name
   * @param slug - Entry slug
   * @returns Function to stop watching
   */
  async watchIssue(
    issueNumber: number,
    collection: string,
    slug: string,
    callbacks: {
      onUpdate?: (notes: Note[], changes: IssueChange[]) => void;
      onChange?: (change: IssueChange) => void;
    },
    initialState: IssueState | null = null,
  ): Promise<() => void> {
    const issueKey = this.getIssueKey(collection, slug);

    // STOP ANY EXISTING WATCH FIRST
    if (this.currentWatch) {
      this.stopCurrentWatch();
    }

    // Get initial state if not provided
    if (!initialState) {
      try {
        initialState = await this.api.getIssueState(issueNumber);
      } catch (error) {
        console.error('[DecapNotes Polling] Failed to get initial state:', error);
      }
    }

    this.currentWatch = {
      issueNumber,
      collection,
      slug,
      etag: null,
      lastState: initialState,
      onUpdate: callbacks.onUpdate,
      onChange: callbacks.onChange,
      retryCount: 0,
      maxRetries: 5,
    };

    this.currentIssueKey = issueKey;

    // Start polling if not already running
    if (!this.intervalId && this.isDocumentVisible) {
      this.startPolling();
    }

    // Do an immediate check
    this.checkCurrentIssue();

    // Return unwatch function
    return () => this.stopCurrentWatch();
  }

  /**
   * Watch issue with retry logic for newly created issues
   */
  async watchIssueWithRetry(
    collection: string,
    slug: string,
    callbacks: {
      onUpdate?: (notes: Note[], changes: IssueChange[]) => void;
      onChange?: (change: IssueChange) => void;
    },
    maxRetries = 5,
    retryDelay = 2000,
  ): Promise<() => void> {
    const issueKey = this.getIssueKey(collection, slug);

    // STOP ANY EXISTING WATCH FIRST
    if (this.currentWatch) {
      this.stopCurrentWatch();
    }

    const attemptWatch = async (attempt: number): Promise<() => void> => {
      try {
        const issue = await this.api.findEntryIssue(collection, slug);

        if (issue) {
          return await this.watchIssue(issue.number, collection, slug, callbacks);
        }

        if (attempt < maxRetries) {
          return new Promise((resolve, reject) => {
            this.pendingRetryTimeout = setTimeout(async () => {
              this.pendingRetryTimeout = null;
              try {
                const unwatchFn = await attemptWatch(attempt + 1);
                resolve(unwatchFn);
              } catch (error) {
                reject(error);
              }
            }, retryDelay);
          });
        }

        console.log(
          `[DecapNotes Polling] No issue found for ${issueKey} after ${maxRetries} attempts. This is expected if there are no notes for this entry yet.`,
        );
        // Return a no-op unwatch function
        return () => {
          /* no-op */
        };
      } catch (error) {
        console.error(`[DecapNotes Polling] Error finding issue for ${issueKey}:`, error);

        if (attempt < maxRetries) {
          return new Promise((resolve, reject) => {
            this.pendingRetryTimeout = setTimeout(async () => {
              this.pendingRetryTimeout = null;
              try {
                const unwatchFn = await attemptWatch(attempt + 1);
                resolve(unwatchFn);
              } catch (err) {
                reject(err);
              }
            }, retryDelay);
          });
        }

        throw error;
      }
    };

    return attemptWatch(1);
  }

  /**
   * Stop watching the current issue - complete cleanup
   */
  private stopCurrentWatch() {
    if (!this.currentWatch) {
      return;
    }

    // Clear any pending retry timeout
    if (this.pendingRetryTimeout) {
      clearTimeout(this.pendingRetryTimeout);
      this.pendingRetryTimeout = null;
    }

    // Clear current watch
    this.currentWatch = null;
    this.currentIssueKey = null;

    // Stop polling since there's nothing to watch
    this.stopPolling();
  }

  /**
   * Start the polling loop
   */
  private startPolling() {
    if (this.intervalId || !this.isDocumentVisible || !this.currentWatch) return;

    console.log(
      `[DecapNotes Polling] Starting polling loop (${this.pollingInterval}ms interval) for ${this.currentIssueKey}`,
    );

    this.intervalId = setInterval(() => {
      this.pollAllIssues();
    }, this.pollingInterval);
  }

  /**
   * Stop the polling loop
   */
  private stopPolling() {
    if (this.intervalId) {
      console.log('[DecapNotes Polling] Stopping polling loop');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Poll current watched issue
   */
  private async pollAllIssues() {
    await this.checkCurrentIssue();
  }

  /**
   * Check current issue for changes using ETag
   */
  private async checkCurrentIssue() {
    if (!this.currentWatch) {
      return;
    }

    if (this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {
      const watch = this.currentWatch;

      const response = await this.api.getIssueWithETag(watch.issueNumber, watch.etag);

      if (response.status === 304) {
        return;
      }

      if (response.status === 200) {
        const newState: IssueState = response.data;
        const newETag = response.etag;

        // Update ETag
        watch.etag = newETag || null;

        // Detect specific changes
        const changes = this.detectChanges(watch.lastState, newState);

        if (changes.length > 0) {
          // Convert comments to notes
          const newNotes = newState.comments.map(comment => ({
            ...this.api.parseCommentToNote(comment),
            issueUrl: newState.html_url,
          }));

          if (watch.onUpdate) {
            watch.onUpdate(newNotes, changes);
          }

          if (watch.onChange) {
            changes.forEach(change => {
              watch.onChange!(change);
            });
          }
        }

        // Update stored state
        watch.lastState = newState;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status !== 304) {
        console.error(`[DecapNotes Polling] Error checking ${this.currentIssueKey}:`, error);
      }
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Immediately check current issue
   */
  private async checkAllIssuesNow() {
    await this.checkCurrentIssue();
  }

  /**
   * Manually trigger a check - only works if this is the current entry
   */
  async checkIssueNow(collection: string, slug: string) {
    const issueKey = this.getIssueKey(collection, slug);

    if (this.currentIssueKey !== issueKey) {
      console.warn(
        `[DecapNotes Polling] Cannot check ${issueKey} - currently watching ${this.currentIssueKey}`,
      );
      return;
    }

    await this.checkCurrentIssue();
  }

  /**
   * Detect what changed between two states
   */
  private detectChanges(previous: IssueState | null, current: IssueState): IssueChange[] {
    if (!previous) {
      return [];
    }

    const changes: IssueChange[] = [];

    // New comments
    const newComments = current.comments.filter(
      comment => !previous.comments.some(prev => prev.id === comment.id),
    );
    newComments.forEach(comment => {
      changes.push({
        type: 'comment_added',
        data: comment,
        timestamp: comment.created_at,
      });
    });

    // Updated comments
    current.comments.forEach(comment => {
      const prevComment = previous.comments.find(prev => prev.id === comment.id);
      if (prevComment && prevComment.updated_at !== comment.updated_at) {
        changes.push({
          type: 'comment_updated',
          data: comment,
          previousData: prevComment,
          timestamp: comment.updated_at,
        });
      }
    });

    // Deleted comments
    const deletedComments = previous.comments.filter(
      prevComment => !current.comments.some(comment => comment.id === prevComment.id),
    );
    deletedComments.forEach(comment => {
      changes.push({
        type: 'comment_deleted',
        data: comment,
        timestamp: new Date().toISOString(),
      });
    });

    // Issue state changed
    if (previous.state !== current.state) {
      changes.push({
        type: 'issue_state_changed',
        data: { from: previous.state, to: current.state },
        timestamp: current.updated_at,
      });
    }

    // Labels changed
    if (this.hasLabelsChanged(previous.labels, current.labels)) {
      changes.push({
        type: 'issue_labels_changed',
        data: { from: previous.labels, to: current.labels },
        timestamp: current.updated_at,
      });
    }

    return changes;
  }

  /**
   * Check if labels changed
   */
  private hasLabelsChanged(
    previous: Array<{ name: string }>,
    current: Array<{ name: string }>,
  ): boolean {
    if (previous.length !== current.length) return true;
    const prevNames = previous.map(l => l.name).sort();
    const currNames = current.map(l => l.name).sort();
    return prevNames.join(',') !== currNames.join(',');
  }

  /**
   * Get issue key for storage
   */
  private getIssueKey(collection: string, slug: string): string {
    return `${collection}/${slug}`;
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.intervalId !== null,
      currentWatch: this.currentIssueKey,
      watchedCount: this.currentWatch ? 1 : 0,
      pollingInterval: this.pollingInterval,
      isDocumentVisible: this.isDocumentVisible,
      hasPendingRetry: this.pendingRetryTimeout !== null,
    };
  }

  /**
   * Clean up - stop all polling
   */
  destroy() {
    console.log('[DecapNotes Polling] Destroying polling manager');

    // Clear pending retry
    if (this.pendingRetryTimeout) {
      clearTimeout(this.pendingRetryTimeout);
      this.pendingRetryTimeout = null;
    }

    // Stop current watch
    this.stopCurrentWatch();
  }
}

export default ETagPollingManager;
