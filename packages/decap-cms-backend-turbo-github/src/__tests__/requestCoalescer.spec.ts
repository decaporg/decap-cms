import { coalesceKey, createRequestCoalescer } from '../requestCoalescer';

/** A stand-in for a real Response: cloneable, and its body readable once. */
function cloneableResponse(body: string) {
  function make(): Response {
    let used = false;
    const response = {
      body,
      clone: () => make(),
      text: () => {
        if (used) {
          return Promise.reject(new Error('body already read'));
        }
        used = true;
        return Promise.resolve(body);
      },
    };
    return response as unknown as Response;
  }
  return make();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('coalesceKey', () => {
  it('keys reads, so two GETs of one URL share a key', () => {
    expect(coalesceKey('GET', 'https://x/y')).toBe(coalesceKey(undefined, 'https://x/y'));
    expect(coalesceKey('get', 'https://x/y')).toBe(coalesceKey('GET', 'https://x/y'));
  });

  it('distinguishes URLs', () => {
    expect(coalesceKey('GET', 'https://x/y')).not.toBe(coalesceKey('GET', 'https://x/z'));
  });

  it('refuses to key anything that writes', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(coalesceKey(method, 'https://x/y')).toBeNull();
    }
  });
});

describe('createRequestCoalescer', () => {
  it('performs one request for concurrent identical reads', async () => {
    const coalesce = createRequestCoalescer();
    const gate = deferred<Response>();
    const perform = jest.fn(() => gate.promise);

    const first = coalesce('GET tree', perform);
    const second = coalesce('GET tree', perform);
    gate.resolve(cloneableResponse('tree'));

    await Promise.all([first, second]);
    expect(perform).toHaveBeenCalledTimes(1);
  });

  it('gives every joined caller its own readable body', async () => {
    const coalesce = createRequestCoalescer();
    const gate = deferred<Response>();

    const first = coalesce('GET tree', () => gate.promise);
    const second = coalesce('GET tree', () => gate.promise);
    gate.resolve(cloneableResponse('tree'));

    // Both read in full. A shared response would fail the second read, which
    // is the whole reason each caller is handed a clone rather than the
    // original.
    await expect((await first).text()).resolves.toBe('tree');
    await expect((await second).text()).resolves.toBe('tree');
  });

  it('does not serve a request that has already settled', async () => {
    const coalesce = createRequestCoalescer();
    const perform = jest.fn(() => Promise.resolve(cloneableResponse('tree')));

    await coalesce('GET tree', perform);
    await coalesce('GET tree', perform);

    // In-flight only: nothing is cached, so this can never hand back a body
    // the network has since moved past.
    expect(perform).toHaveBeenCalledTimes(2);
  });

  it('keeps unrelated reads separate', async () => {
    const coalesce = createRequestCoalescer();
    const gate = deferred<Response>();
    const perform = jest.fn(() => gate.promise);

    const a = coalesce('GET tree', perform);
    const b = coalesce('GET blob', perform);
    gate.resolve(cloneableResponse('x'));

    await Promise.all([a, b]);
    expect(perform).toHaveBeenCalledTimes(2);
  });

  it('never joins an unkeyed request', async () => {
    const coalesce = createRequestCoalescer();
    const gate = deferred<Response>();
    const perform = jest.fn(() => gate.promise);

    const a = coalesce(null, perform);
    const b = coalesce(null, perform);
    gate.resolve(cloneableResponse('x'));

    await Promise.all([a, b]);
    expect(perform).toHaveBeenCalledTimes(2);
  });

  it('rejects every joined caller when the request fails, and forgets it', async () => {
    const coalesce = createRequestCoalescer();
    const gate = deferred<Response>();
    const perform = jest.fn(() => gate.promise);

    const first = coalesce('GET tree', perform);
    const second = coalesce('GET tree', perform);
    gate.reject(new Error('boom'));

    await expect(first).rejects.toThrow('boom');
    await expect(second).rejects.toThrow('boom');

    // A failure must not leave the key poisoned for the rest of the session.
    const retry = jest.fn(() => Promise.resolve(cloneableResponse('tree')));
    await coalesce('GET tree', retry);
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('passes a response through unshared when it cannot be cloned', async () => {
    const coalesce = createRequestCoalescer();
    const plain = { status: 200 } as unknown as Response;

    // Non-standard fetch implementations and test doubles return plain objects.
    // Losing the optimisation is acceptable; throwing on a missing `clone` is
    // not.
    await expect(coalesce('GET tree', () => Promise.resolve(plain))).resolves.toBe(plain);
  });
});
