/* eslint-disable emotion/no-vanilla */
import '@testing-library/jest-dom/extend-expect';
import fetch from 'node-fetch';
import * as emotion from 'emotion';
import { createSerializer } from 'jest-emotion';

window.fetch = fetch;
window.URL.createObjectURL = jest.fn();
expect.addSnapshotSerializer(createSerializer(emotion));
