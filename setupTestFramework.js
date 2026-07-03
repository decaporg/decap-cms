/* eslint-disable @emotion/no-vanilla */
import '@testing-library/jest-dom/extend-expect';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';

jest.mock('path', () => {
  const actual = jest.requireActual('path');
  return {
    ...actual.posix,
  };
});

window.fetch = fetch;
window.URL.createObjectURL = jest.fn();

// @ts-expect-error — we’re only providing a subset of the crypto API, because that’s all that’s used.
// TODO: Remove when updating to Jest >=29 which includes support for the crypto API.
window.crypto = { randomUUID };
