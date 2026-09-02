/**
 * Collapses concurrent, identical reads into a single round trip.
 *
 * Decap's read paths fan out per locale and per collection without any shared
 * view of what is already in flight, so several callers routinely ask for the
 * exact same URL at the exact same moment. On a site with `i18n.structure:
 * multiple_files`, opening one entry calls `getEntry` once per locale
 * concurrently, and each locale that misses the content cache resolves its blob
 * sha from the *same* parent-folder tree — measured on the tester as two
 * identical `git/trees/{branch}:content/posts` requests fired in the same tick,
 * 2.7s and 4.4s. Through a proxy that charges a fixed ~1.3s preamble per
 * request, the duplicate is pure waste.
 *
 * Deliberately in-flight only: an entry is dropped the moment its request
 * settles, so this can never serve a body from a completed request. It joins
 * callers that genuinely overlap in time and nothing else, which is what makes
 * it safe to apply to reads generally without reasoning about staleness — there
 * is no window in which the cache holds something the network has moved past.
 *
 * NOTE: mirrored in decap-cms-backend-turbo-gitlab, for the same reason
 * `supabase.ts` is — see that file's header.
 */

/** Only idempotent reads are joined. A second POST is a second intended write,
 *  never a duplicate to fold away. */
function isCoalescable(method: string | undefined) {
  return !method || method.toUpperCase() === 'GET';
}

/**
 * Method and URL, and deliberately not headers: two reads of one URL are
 * assumed to want the same representation. That holds across both backends —
 * where a caller wants a different representation it asks a different URL (the
 * one exception, `retrieveMetadataOld`'s raw-media-type read, carries its own
 * distinct `ref` param) — but it is the assumption to revisit first if a
 * joined read ever hands back the wrong body.
 */
export function coalesceKey(method: string | undefined, url: string) {
  return isCoalescable(method) ? `GET ${url}` : null;
}

export interface RequestCoalescer {
  (key: string | null, perform: () => Promise<Response>): Promise<Response>;
}

/**
 * Every caller — the one that started the request included — reads a clone, so
 * the original response body is never consumed and stays cloneable for however
 * many callers join. Handing the first caller the original instead would break
 * as soon as it read the body, because the join is resolved in a later
 * microtask and `clone()` throws on a disturbed body.
 *
 * The capability check is for non-standard fetch implementations (and test
 * doubles) whose responses are plain objects: those simply pass through
 * unshared, which costs the optimisation rather than correctness.
 */
function share(response: Response): Response {
  return typeof response?.clone === 'function' ? response.clone() : response;
}

export function createRequestCoalescer(): RequestCoalescer {
  const inFlight = new Map<string, Promise<Response>>();

  /**
   * Guarded so a slow request settling after a newer one has already replaced
   * it cannot evict the newer entry.
   */
  function forget(key: string, request: Promise<Response>) {
    if (inFlight.get(key) === request) {
      inFlight.delete(key);
    }
  }

  return (key, perform) => {
    if (!key) {
      return perform();
    }

    const existing = inFlight.get(key);
    if (existing) {
      return existing.then(share);
    }

    const request = perform();
    inFlight.set(key, request);

    // Dropped as soon as it settles, whichever way it settles — a failure must
    // not leave the key poisoned for the rest of the session. Written as two
    // handlers rather than `.finally` so the rejection is swallowed here
    // instead of surfacing as an unhandled one on a promise nobody holds.
    request.then(
      () => forget(key, request),
      () => forget(key, request),
    );

    return request.then(share);
  };
}
