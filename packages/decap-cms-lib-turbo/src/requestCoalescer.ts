/**
 * Collapses concurrent, identical reads into a single round trip.
 *
 * Decap's read paths fan out per locale and per collection with no shared view
 * of what is in flight, so identical URLs are often requested in the same tick
 * (an i18n entry open reads the same folder listing once per locale).
 *
 * In-flight only: an entry is dropped the moment its request settles, so this
 * can never serve a body the network has moved past.
 */

/** Only idempotent reads are joined. A second POST is a second intended write,
 *  never a duplicate to fold away. */
function isCoalescable(method: string | undefined) {
  return !method || method.toUpperCase() === 'GET';
}

/**
 * Method and URL, deliberately not headers: two reads of one URL are assumed
 * to want the same representation. Revisit this first if a joined read ever
 * hands back the wrong body.
 */
export function coalesceKey(method: string | undefined, url: string) {
  return isCoalescable(method) ? `GET ${url}` : null;
}

export interface RequestCoalescer {
  (key: string | null, perform: () => Promise<Response>): Promise<Response>;
}

/**
 * Every caller, the first included, reads a clone: joins resolve in a later
 * microtask, and `clone()` throws on a disturbed body. Responses without
 * `clone` (plain objects, test doubles) pass through unshared.
 */
function share(response: Response): Response {
  return typeof response?.clone === 'function' ? response.clone() : response;
}

export function createRequestCoalescer(): RequestCoalescer {
  const inFlight = new Map<string, Promise<Response>>();

  /** Guarded so a slow request settling late cannot evict a newer entry. */
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

    // Dropped however it settles, so a failure cannot poison the key; two
    // handlers rather than `.finally` so the rejection is not left unhandled.
    request.then(
      () => forget(key, request),
      () => forget(key, request),
    );

    return request.then(share);
  };
}
