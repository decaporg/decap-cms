import AssetProxy from "ValueObjects/AssetProxy";
import API from "../API";

describe('github API', () => {
  const mockAPI = (api, responses) => {
    api.request = (path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.substr(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`))
    };
  }

  it('should create PR with correct base branch name when publishing with editorial workflow', () => {
    let prBaseBranch = null;
    const api = new API({ branch: 'gh-pages', repo: 'my-repo' });
    const responses = {
      '/repos/my-repo/branches/gh-pages': () => ({ commit: { sha: 'def' } }),
      '/repos/my-repo/git/trees/def': () => ({ tree: [] }),
      '/repos/my-repo/git/trees': () => ({}),
      '/repos/my-repo/git/commits': () => ({}),
      '/repos/my-repo/git/refs': () => ({}),
      '/repos/my-repo/pulls': (pullRequest) => {
        prBaseBranch = JSON.parse(pullRequest.body).base;
        return { head: { sha: 'cbd' } };
      },
      '/user': () => ({}),
      '/repos/my-repo/git/blobs': () => ({}),
      '/repos/my-repo/git/refs/meta/_netlify_cms': () => ({ 'object': {} })
    };
    mockAPI(api, responses);

    return expect(
      api.editorialWorkflowGit(null, { slug: 'entry', sha: 'abc' }, null, {})
        .then(() => prBaseBranch)
    ).resolves.toEqual('gh-pages')
  });
});
