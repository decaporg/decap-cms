import { createServer } from 'net';

import { runDevServer } from './server.js';

describe('runDevServer', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects with one line instead of a stack trace when the port is taken', async () => {
    const blocker = createServer();
    await new Promise<void>((resolve, reject) => {
      blocker.once('error', reject);
      blocker.listen(0, '127.0.0.1', () => resolve());
    });
    const address = blocker.address();
    if (!address || typeof address === 'string') throw new Error('no port assigned');
    const { port } = address;

    try {
      await expect(runDevServer({ port, host: '127.0.0.1', logLevel: 'error' })).rejects.toThrow(
        `Port ${port} is already in use; pass --port <other>`,
      );
    } finally {
      await new Promise<void>(resolve => blocker.close(() => resolve()));
    }
  });

  it('listens on this machine only unless a host is given', async () => {
    const server = await runDevServer({ port: 0, logLevel: 'error' });
    try {
      expect(server.address()).toMatchObject({ address: '127.0.0.1' });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
