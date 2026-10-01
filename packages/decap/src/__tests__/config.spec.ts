import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  credentialsPath,
  deleteCredentials,
  readCredentials,
  resolveAuth,
  writeCredentials,
} from '../config.js';
import { deviceName } from '../login.js';

const credentials = {
  apiUrl: 'http://localhost:4321',
  token: 'dcp_' + 'a'.repeat(43),
  tokenId: 't1',
  scope: 'editor' as const,
  expiresAt: null,
  email: 'x@example.com',
};

describe('credentials', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.XDG_CONFIG_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'decap-test-'));
    delete process.env.DECAP_TOKEN;
    delete process.env.DECAP_API_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('stores credentials owner-only', () => {
    writeCredentials(credentials);
    expect(fs.statSync(credentialsPath()).mode & 0o777).toBe(0o600);
    expect(fs.statSync(path.dirname(credentialsPath())).mode & 0o777).toBe(0o700);
    expect(readCredentials()).toEqual(credentials);
  });

  it('uses the stored token only for the API that issued it', () => {
    writeCredentials(credentials);
    expect(resolveAuth().token).toBe(credentials.token);
    expect(resolveAuth().apiUrl).toBe('http://localhost:4321');
    expect(resolveAuth({ apiUrl: 'https://turbo.decapcms.org' }).token).toBeNull();
  });

  it('lets DECAP_TOKEN win over the stored token', () => {
    writeCredentials(credentials);
    process.env.DECAP_TOKEN = 'dcp_' + 'b'.repeat(43);
    expect(resolveAuth().token).toBe(process.env.DECAP_TOKEN);
  });

  it('defaults to production and trims trailing slashes', () => {
    deleteCredentials();
    expect(resolveAuth().apiUrl).toBe('https://turbo.decapcms.org');
    expect(resolveAuth({ apiUrl: 'http://localhost:4321///' }).apiUrl).toBe(
      'http://localhost:4321',
    );
  });
});

describe('deviceName', () => {
  it('labels the device by its short hostname', () => {
    expect(deviceName('Martins-MBP.local')).toBe('Martins-MBP');
    expect(deviceName('Honor_9_Lite-b514ec1d2653.localdomain')).toBe('Honor_9_Lite-b514ec1d2653');
    expect(deviceName('build-42.ci.example.com')).toBe('build-42');
  });
});
