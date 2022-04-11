import nock from 'nock';

import * as api from '../API';

const { Backend, LocalStorageAuthStore } = jest.requireActual('netlify-cms-core/src/backend')

const branchProp = { default_branch: 'master' };

const repoResp = {
  github: {
    ...branchProp,
    owner: {
      login: 'owner'
    },
    permissions: {
      pull: true,
      push: true,
      admin: true,
    },
  },
  gitlab: {
    ...branchProp,
    permissions: {
      project_access: {
        access_level: 10,
      },
    },
  },
  bitbucket: {
    mainbranch: {
      name: 'master',
    },
  },
};

const MOCK_CREDENTIALS = { token: 'MOCK_TOKEN' };
const REPO_PATH = 'foo/bar';

function mockApi(backend) {
  return nock(backend.apiRoot);
}

export function interceptRepo(backend) {
  const api = mockApi(backend);
  api.get(backend.repoEndpoint).query(true).reply(200, repoResp[backend.backendName]);
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
  describe('getDefaultBranchName', () => {
    it('should return non-empty string as default branch', async () => {
      const {
        apiRoots,
        endpointConstants: { singleRepo: staticRepoEndpoints },
      } = api;
      let normalizedRepoPath;
      for (const backendName in apiRoots) {
        if (backendName === 'gitlab') {
          // Gitlab API requires the repo slug to be url-encoded
          normalizedRepoPath = encodeURIComponent(REPO_PATH);
        } else {
          normalizedRepoPath = REPO_PATH;
        }
        const repoEndpoint = `${staticRepoEndpoints[backendName]}/${normalizedRepoPath}`;
        interceptRepo({ apiRoot: apiRoots[backendName], repoEndpoint, backendName });
        const defaultBranchName = await api.getDefaultBranchName({
          backend: backendName,
          repo: REPO_PATH,
          token: MOCK_CREDENTIALS.token,
        });
        expect(defaultBranchName).not.toBe('');
      }
    });
  });
});
