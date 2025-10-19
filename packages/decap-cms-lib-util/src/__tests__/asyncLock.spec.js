import { asyncLock } from '../asyncLock';

jest.useFakeTimers();
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('asyncLock', () => {
  it('should be able to acquire a new lock', async () => {
    const lock = asyncLock();

    const acquired = await lock.acquire();

    expect(acquired).toBe(true);
  });

  it('should not be able to acquire an acquired lock', async () => {
    const lock = asyncLock();
    await lock.acquire();

    const promise = lock.acquire();

    // advance by default lock timeout
    jest.advanceTimersByTime(15000);

    const acquired = await promise;

    expect(acquired).toBe(false);
  });

  it('should be able to acquire an acquired lock that was released', async () => {
    const lock = asyncLock();
    await lock.acquire();

    const promise = lock.acquire();

    // release the lock in the "future"
    setTimeout(() => lock.release(), 100);

    // advance to the time where the lock will be released
    jest.advanceTimersByTime(100);

    const acquired = await promise;

    expect(acquired).toBe(true);
  });

  it('should accept a timeout for acquire', async () => {
    const lock = asyncLock();
    await lock.acquire();

    const promise = lock.acquire(50);

    /// advance by lock timeout
    jest.advanceTimersByTime(50);

    const acquired = await promise;

    expect(acquired).toBe(false);
  });

  it('should be able to re-acquire a lock after a timeout', async () => {
    const lock = asyncLock();
    await lock.acquire();

    const promise = lock.acquire();

    // advance by default lock timeout
    jest.advanceTimersByTime(15000);

    let acquired = await promise;

    expect(acquired).toBe(false);

    acquired = await lock.acquire();
    expect(acquired).toBe(true);
  });

  it('should suppress "leave called too many times" error', async () => {
    const lock = asyncLock();

    await expect(() => lock.release()).not.toThrow();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith('leave called too many times.');
  });
});
