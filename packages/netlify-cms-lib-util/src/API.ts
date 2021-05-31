import { asyncLock } from './asyncLock';
import unsentRequest from './unsentRequest';
import APIError from './APIError';

import type { AsyncLock } from './asyncLock';

export interface FetchError extends Error {
  status: number;
}

interface API {
  rateLimiter?: AsyncLock;
  buildRequest: (req: ApiRequest) => ApiRequest | Promise<ApiRequest>;
  requestFunction?: (req: ApiRequest) => Promise<Response>;
}

export type ApiRequestObject = {
  url: string;
  params?: Record<string, string | boolean | number>;
  method?: 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  cache?: 'no-store';
};

export type ApiRequest = ApiRequestObject | string;

class RateLimitError extends Error {
  resetSeconds: number;

  constructor(message: string, resetSeconds: number) {
    super(message);
    if (resetSeconds < 0) {
      this.resetSeconds = 1;
    } else if (resetSeconds > 60 * 60) {
      this.resetSeconds = 60 * 60;
    } else {
      this.resetSeconds = resetSeconds;
    }
  }
}

export async function requestWithBackoff(
  api: API,
  req: ApiRequest,
  attempt = 1,
): Promise<Response> {
  if (api.rateLimiter) {
    await api.rateLimiter.acquire();
  }

  try {
    const builtRequest = await api.buildRequest(req);
    const requestFunction = api.requestFunction || unsentRequest.performRequest;
    const response: Response = await requestFunction(builtRequest);
    if (response.status === 429) {
      // GitLab/Bitbucket too many requests
      const text = await response.text().catch(() => 'Too many requests');
      throw new Error(text);
    } else if (response.status === 403) {
      // GitHub too many requests
      const json = await response.json().catch(() => ({ message: '' }));
      if (json.message.match('API rate limit exceeded')) {
        const now = new Date();
        const nextWindowInSeconds = response.headers.has('X-RateLimit-Reset')
          ? parseInt(response.headers.get('X-RateLimit-Reset')!)
          : now.getTime() / 1000 + 60;

        throw new RateLimitError(json.message, nextWindowInSeconds);
      }
      response.json = () => Promise.resolve(json);
    }
    return response;
  } catch (err) {
    if (attempt > 5 || err.message === "Can't refresh access token when using implicit auth") {
      throw err;
    } else {
      if (!api.rateLimiter) {
        const timeout = err.resetSeconds || attempt * attempt;
        console.log(
          `Pausing requests for ${timeout} ${
            attempt === 1 ? 'second' : 'seconds'
          } due to fetch failures:`,
          err.message,
        );
        api.rateLimiter = asyncLock();
        api.rateLimiter.acquire();
        setTimeout(() => {
          api.rateLimiter?.release();
          api.rateLimiter = undefined;
          console.log(`Done pausing requests`);
        }, 1000 * timeout);
      }
      return requestWithBackoff(api, req, attempt + 1);
    }
  }
}

export async function readFile(
  id: string | null | undefined,
  fetchContent: () => Promise<string | Blob>,
  localForage: LocalForage,
  isText: boolean,
) {
  const key = id ? (isText ? `gh.${id}` : `gh.${id}.blob`) : null;
  const cached = key ? await localForage.getItem<string | Blob>(key) : null;
  if (cached) {
    return cached;
  }

  const content = await fetchContent();
  if (key) {
    await localForage.setItem(key, content);
  }
  return content;
}

export type FileMetadata = {
  author: string;
  updatedOn: string;
};

function getFileMetadataKey(id: string) {
  return `gh.${id}.meta`;
}

export async function readFileMetadata(
  id: string | null | undefined,
  fetchMetadata: () => Promise<FileMetadata>,
  localForage: LocalForage,
) {
  const key = id ? getFileMetadataKey(id) : null;
  const cached = key && (await localForage.getItem<FileMetadata>(key));
  if (cached) {
    return cached;
  }

  const metadata = await fetchMetadata();
  if (key) {
    await localForage.setItem<FileMetadata>(key, metadata);
  }
  return metadata;
}

/**
 * Keywords for inferring a status that will provide a deploy preview URL.
 */
const PREVIEW_CONTEXT_KEYWORDS = ['deploy'];

/**
 * Check a given status context string to determine if it provides a link to a
 * deploy preview. Checks for an exact match against `previewContext` if given,
 * otherwise checks for inclusion of a value from `PREVIEW_CONTEXT_KEYWORDS`.
 */
export function isPreviewContext(context: string, previewContext: string) {
  if (previewContext) {
    return context === previewContext;
  }
  return PREVIEW_CONTEXT_KEYWORDS.some(keyword => context.includes(keyword));
}

export enum PreviewState {
  Other = 'other',
  Success = 'success',
}

/**
 * Retrieve a deploy preview URL from an array of statuses. By default, a
 * matching status is inferred via `isPreviewContext`.
 */
export function getPreviewStatus(
  statuses: {
    context: string;
    target_url: string;
    state: PreviewState;
  }[],
  previewContext: string,
) {
  return statuses.find(({ context }) => {
    return isPreviewContext(context, previewContext);
  });
}

function getConflictingBranches(branchName: string) {
  // for cms/posts/post-1, conflicting branches are cms/posts, cms
  const parts = branchName.split('/');
  parts.pop();

  const conflictingBranches = parts.reduce((acc, _, index) => {
    acc = [...acc, parts.slice(0, index + 1).join('/')];
    return acc;
  }, [] as string[]);

  return conflictingBranches;
}

export async function throwOnConflictingBranches(
  branchName: string,
  getBranch: (name: string) => Promise<{ name: string }>,
  apiName: string,
) {
  const possibleConflictingBranches = getConflictingBranches(branchName);

  const conflictingBranches = await Promise.all(
    possibleConflictingBranches.map(b =>
      getBranch(b)
        .then(b => b.name)
        .catch(() => ''),
    ),
  );

  const conflictingBranch = conflictingBranches.filter(Boolean)[0];
  if (conflictingBranch) {
    throw new APIError(
      `Failed creating branch '${branchName}' since there is already a branch named '${conflictingBranch}'. Please delete the '${conflictingBranch}' branch and try again`,
      500,
      apiName,
    );
  }
}
