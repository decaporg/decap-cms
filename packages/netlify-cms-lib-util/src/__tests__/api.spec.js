import nock from 'nock';
import { set } from 'lodash'

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
        access_level: 30, // This means the user is at least a developer
        // and can be a maintainer or owner. If this number is below
        // 30, user is not a collaborator and Gitlab API will throw
        // an error
      },
    },
  },
  bitbucket: {
    mainbranch: {
      name: 'master',
    },
  },
};

const userResp = {
  github: {
    success: {
      id: 1
    }
  },
  gitlab: {
    success: {
      id: 1
    }
  },
  bitbucket: {
    success: {
      id: 1,
      display_name: 'Test Account',
      username: 'test',
      links: {
        avatar: {
          href: 'https://example.com'
        }
      }
    }
  }
}

const MOCK_CREDENTIALS = { token: 'MOCK_TOKEN' };
const REPO_PATH = 'foo/bar';
const defaultConfig = {
  backend: {
    name: 'github',
    repo: REPO_PATH
  }
}

function mockApi(backend) {
  return nock(backend.implementation.apiRoot);
}

export function interceptRepo(backend) {
function getRepoEndpoint(backendName, repo = REPO_PATH) {
  const prefix = api.endpointConstants['singleRepo'][backendName]
  switch(backendName) {
    case 'gitlab':
      return `${prefix}/${encodeURIComponent(repo)}`
    default:
      return `${prefix}/${repo}`
  }
}

export function interceptRepo(backend, urlPath) {
  // A URL path given to Nock needs to start with a forward slash. 
  if (urlPath[0] !== '/') {
    urlPath = `/${urlPath}`
  }
  const api = mockApi(backend);
  api.get(urlPath).query(true).reply(200, repoResp[backend.backendName]);
}

let authStore, backend

function resolveBackend(config = defaultConfig) {
  const { backend: { name } } = config
  authStore = new LocalStorageAuthStore()
  const options = { backendName: name, config, authStore }
  switch(name) {
    case 'gitlab':
      return new Backend(
        {
          init: (...args) => new GitLab(...args)
        },
        options
      )
    case 'bitbucket':
      return new Backend(
        {
          init: (...args) => new BitBucket(...args)
        },
        options
      )
    default:
      return new Backend(
        {
          init: (...args) => {
            return new GitHub(...args) 
          }
        },
        options
      )
  }

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
    const {
      apiRoots,
      endpointConstants: { singleRepo: staticRepoEndpoints },
    } = api;
    it('should return non-empty string as default branch', async () => {
      let normalizedRepoPath;
      for (const backendName in apiRoots) {
        if (backendName === 'gitlab') {
          // Gitlab API requires the repo slug to be url-encoded
          normalizedRepoPath = encodeURIComponent(REPO_PATH);
        } else {
          normalizedRepoPath = REPO_PATH;
        }
        const repoEndpoint = `${staticRepoEndpoints[backendName]}/${normalizedRepoPath}`;
        const backendConfig = set(defaultConfig, 'backend.name', backendName)
        backend = resolveBackend(backendConfig)
        interceptRepo(backend, repoEndpoint);
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
