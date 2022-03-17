import nock from "nock";

import * as api from '../API';

const branchProp = { default_branch: 'master' }

const repoResp = {
  github: {
    ...branchProp,
    permissions: {
      pull: true,
      push: true,
      admin: true
    }
  },
  gitlab: {
    ...branchProp,
    permissions: {
      project_access: {
        access_level: 10
      }
    }
  },
  bitbucket: {
    mainbranch: {
      name: "master"
    }
  }
}

const MOCK_CREDENTIALS = { token: 'MOCK_TOKEN' }
const REPO_PATH = 'foo/bar'

function mockApi(backend) {
  return nock(backend.apiRoot)
}

export function interceptRepo(backend) {
  const api = mockApi(backend)
  api
    .get(backend.repoEndpoint)
    .query(true)
    .reply(200, repoResp[backend.backendName])
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
