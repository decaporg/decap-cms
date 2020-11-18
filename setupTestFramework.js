/* eslint-disable @emotion/no-vanilla */
import '@testing-library/jest-dom/extend-expect';
import fetch from 'node-fetch';

jest.mock('path', () => {
  const actual = jest.requireActual('path');
  return {
    ...actual.posix,
  };
});

window.fetch = fetch;
window.URL.createObjectURL = jest.fn();
