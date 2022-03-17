import nock from "nock";

import * as api from '../API';

const branchProp = { default_branch: 'master' }
const MOCK_CREDENTIALS = { token: 'MOCK_TOKEN' }
const REPO_PATH = 'foo/bar'

function mockApi(backend) {
  return nock(backend.apiRoot)
}

describe('Api', () => {
  describe('getPreviewStatus', () => {
    it('should return preview status on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'deploy' }])).toEqual({ context: 'deploy' });
    });

    it('should return undefined on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'other' }])).toBeUndefined();
    });
  });
});
