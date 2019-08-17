/* eslint-disable emotion/no-vanilla */
import fetch from 'node-fetch';
import * as emotion from 'emotion';
import { createSerializer } from 'jest-emotion';

window.fetch = fetch;
expect.addSnapshotSerializer(createSerializer(emotion));
