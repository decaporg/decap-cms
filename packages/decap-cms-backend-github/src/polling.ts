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
}

export interface GitHubNotesAPI {
  getIssueState(issueNumber: number): Promise<IssueState>;
  getIssueWithETag(
    issueNumber: number,
    etag: string | null
  ): Promise<
    | { status: 304; data?: never; etag?: never }
    | { status: 200; data: IssueState; etag: string | null }
  >;
  parseCommentToNote(comment: CommentData): Note;
}

// Redux action types
export const NOTES_POLLING_START = 'NOTES_POLLING_START';
export const NOTES_POLLING_STOP = 'NOTES_POLLING_STOP';
export const NOTES_POLLING_UPDATE = 'NOTES_POLLING_UPDATE';
export const NOTES_CHANGE_DETECTED = 'NOTES_CHANGE_DETECTED';

export class ETagPollingManager {
  private watchedIssues: Map<string, WatchedIssue> = new Map();
  private pollingInterval = 15000;
  private intervalId: NodeJS.Timeout | null = null;
  private isDocumentVisible = true;
  private api: GitHubNotesAPI;
  private isPolling = false;

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
          console.log('[Polling] Tab visible, resuming polling');
          this.startPolling();
          this.checkAllIssuesNow();
        } else {
          console.log('[Polling] Tab hidden, pausing polling');
          this.stopPolling();
        }
      });
    }
  }

  /**
   * Start watching an issue for changes
   * 
   * @param issueNumber - GitHub issue number
   * @param collection - Collection name
   * @param slug - Entry slug
   * @param initialState - Initial issue state (optional)
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
    initialState: IssueState | null = null
  ): Promise<() => void> {
    const issueKey = this.getIssueKey(collection, slug);

    console.log(`[Polling] Starting to watch issue #${issueNumber} for ${issueKey}`);

    // Get initial state if not provided
    if (!initialState) {
      try {
        initialState = await this.api.getIssueState(issueNumber);
      } catch (error) {
        console.error('[Polling] Failed to get initial state:', error);
      }
    }

    this.watchedIssues.set(issueKey, {
      issueNumber,
      collection,
      slug,
      etag: null,
      lastState: initialState,
      onUpdate: callbacks.onUpdate,
      onChange: callbacks.onChange,
    });

    // Start polling if not already running
    if (!this.intervalId && this.isDocumentVisible) {
      this.startPolling();
    }

    // Do an immediate check
    this.checkIssue(issueKey);

    // Return unwatch function
    return () => this.unwatchIssue(issueKey);
  }

  /**
   * Stop watching an issue
   */
  private unwatchIssue(issueKey: string) {
    console.log(`[Polling] Stopped watching issue ${issueKey}`);
    // REMOVE all dispatch-related code
    this.watchedIssues.delete(issueKey);

    if (this.watchedIssues.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Start the polling loop
   */
  private startPolling() {
    if (this.intervalId || !this.isDocumentVisible) return;

    console.log(`[Polling] Starting polling loop (${this.pollingInterval}ms interval)`);
    
    this.intervalId = setInterval(() => {
      this.pollAllIssues();
    }, this.pollingInterval);
  }

  /**
   * Stop the polling loop
   */
  private stopPolling() {
    if (this.intervalId) {
      console.log('[Polling] Stopping polling loop');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Poll all watched issues
   */
  private async pollAllIssues() {
    if (this.isPolling) {
      console.log('[Polling] Already polling, skipping cycle');
      return;
    }

    this.isPolling = true;

    try {
      const issues = Array.from(this.watchedIssues.keys());
      
      for (const issueKey of issues) {
        await this.checkIssue(issueKey);
        // Small delay between checks
        await this.delay(500);
      }
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Check a single issue for changes using ETag
   */
  private async checkIssue(issueKey: string) {
    const watched = this.watchedIssues.get(issueKey);
    if (!watched) return;

    try {
      console.log(`[Polling] Checking ${issueKey} (ETag: ${watched.etag ? 'yes' : 'no'})`);

      const response = await this.api.getIssueWithETag(
        watched.issueNumber,
        watched.etag
      );

      if (response.status === 304) {
        console.log(`[Polling] ${issueKey} - No changes (304)`);
        return;
      }

      if (response.status === 200) {
        const newState: IssueState = response.data;
        const newETag = response.etag;

        console.log(`[Polling] ${issueKey} - Changes detected!`);

        // Update ETag
        watched.etag = newETag || null;

        // Detect specific changes
        const changes = this.detectChanges(watched.lastState, newState);

        if (changes.length > 0) {
          // Convert comments to notes
          const newNotes = newState.comments.map(comment => ({
            ...this.api.parseCommentToNote(comment),
            issueUrl: newState.html_url, 
            }));

          if (watched.onUpdate) {
            watched.onUpdate(newNotes, changes)
          }
          
          if (watched.onChange) {
            changes.forEach(change => {
              watched.onChange!(change);
            })
          }
        }

        // Update stored state
        watched.lastState = newState;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status !== 304) {
        console.error(`[Polling] Error checking ${issueKey}:`, error);
      }
    }
  }

  /**
   * Immediately check all issues
   */
  private async checkAllIssuesNow() {
    console.log('[Polling] Checking all issues immediately');
    const issues = Array.from(this.watchedIssues.keys());
    
    for (const issueKey of issues) {
      await this.checkIssue(issueKey);
      await this.delay(500);
    }
  }

  /**
   * Manually trigger a check for a specific issue
   */
  async checkIssueNow(collection: string, slug: string) {
    const issueKey = this.getIssueKey(collection, slug);
    console.log(`[Polling] Manual check requested for ${issueKey}`);
    await this.checkIssue(issueKey);
  }

  /**
   * Detect what changed between two states
   */
  private detectChanges(
    previous: IssueState | null,
    current: IssueState
  ): IssueChange[] {
    if (!previous) {
      return [];
    }

    const changes: IssueChange[] = [];

    // New comments
    const newComments = current.comments.filter(
      comment => !previous.comments.some(prev => prev.id === comment.id)
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
      prevComment => !current.comments.some(comment => comment.id === prevComment.id)
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
    current: Array<{ name: string }>
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
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.intervalId !== null,
      watchedCount: this.watchedIssues.size,
      pollingInterval: this.pollingInterval,
      isDocumentVisible: this.isDocumentVisible,
    };
  }

  /**
   * Clean up - stop all polling
   */
  destroy() {
    console.log('[Polling] Destroying polling manager');
    this.stopPolling();
    this.watchedIssues.clear();
  }
}

export default ETagPollingManager;