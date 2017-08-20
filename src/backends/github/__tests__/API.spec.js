import fetchMock from 'fetch-mock';
import { curry, escapeRegExp, isMatch, merge } from 'lodash';
import { Map } from 'immutable';

import AssetProxy from "../../../valueObjects/AssetProxy";
import API from '../API';

const compose = (...fns) => val => fns.reduceRight((newVal, fn) => fn(newVal), val);
const pipe = (...fns) => compose(...fns.reverse());

const regExpOrString = rOrS => (rOrS instanceof RegExp ? rOrS.toString() : escapeRegExp(rOrS));

const mockForAllParams = url => `${url}(\\?.*)?`;
const prependRoot = urlRoot => url => `${urlRoot}${url}`;
const matchWholeURL = str => `^${str}$`;
const strToRegex = str => new RegExp(str);
const matchURL = curry((urlRoot, forAllParams, url) => pipe(
  regExpOrString,
  ...(forAllParams ? [mockForAllParams] : []),
  pipe(regExpOrString, prependRoot)(urlRoot),
  matchWholeURL,
  strToRegex,
)(url));

// `mock` gives us a few advantages over using the standard
// `fetchMock.mock`:
//  - Routes can have a root specified that is prepended to the path 
//  - By default, routes swallow URL parameters (the GitHub API code
//    uses a `ts` parameter on _every_ request)
const mockRequest = curry((urlRoot, url, response, options={}) => {
  const mergedOptions = merge({}, {
    forAllParams: true,
    fetchMockOptions: {},
  }, options);
  return fetchMock.mock(
    matchURL(urlRoot, mergedOptions.forAllParams, url),
    response,
    options.fetchMockOptions,
  );
});

const defaultResponseHeaders = { "Content-Type": "application/json" };

afterEach(() => fetchMock.restore());

describe('github API', () => {
  it('should correctly detect a contributor', () => {
    const api = new API({ branch: 'test-branch', repo: 'test-user/test-repo' });
    mockRequest(api.api_root)('/user/repos', {
      headers: defaultResponseHeaders,
      body: [{
        id: 1,
        full_name: 'test-user/test-repo',
        permissions: {
          admin: false,
          push: true,
          pull: true,
        },
      }],
    });
    return expect(api.isCollaborator({})).resolves.toBe(true);
  });
  
  it('should correctly detect a non-contributor', () => {
    const api = new API({ branch: 'test-branch', repo: 'test-user/test-repo' });
    mockRequest(api.api_root)('/user/repos', {
      headers: defaultResponseHeaders,
      body: [{
        id: 1,
        full_name: 'test-user/test-repo',
        permissions: {
          admin: false,
          push: false,
          pull: true,
        },
      }],
    });
    return expect(api.isCollaborator({})).resolves.toBe(false);
  });
  
  it('should list the files in a directory', () => {
    const api = new API({ branch: 'test-branch', repo: 'test-user/test-repo' });
    mockRequest(api.api_root)(`${ api.repoURL }/contents/test-directory`, {
      headers: defaultResponseHeaders,
      body: [
        {
          type: "file",
          size: 625,
          name: "octokit.rb",
          path: "test-directory/octokit.rb",
          sha: "fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b",
        },
        {
          type: "dir",
          size: 0,
          name: "octokit",
          path: "test-directory/octokit",
          sha: "a84d88e7554fc1fa21bcbc4efae3c782a70d2b9d",
        },
      ],
    });
    return expect(api.listFiles('test-directory')).resolves.toMatchObject([
      {
        type: "file",
        size: 625,
        name: "octokit.rb",
        path: "test-directory/octokit.rb",
        sha: "fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b",
      },
    ]);
  });
  

  it('should create PR with correct base branch name when publishing with editorial workflow', () => {
    let prBaseBranch = null;
    const api = new API({ branch: 'gh-pages', repo: 'my-repo' });
    const responses = [
      ['/repos/my-repo/branches/gh-pages', {
        headers: defaultResponseHeaders,
        body: { commit: { sha: 'def' } },
      }],
      ['/repos/my-repo/git/trees/def', {
        headers: defaultResponseHeaders,
        body: { tree: [] },
      }],
      ['/repos/my-repo/git/trees', {
        headers: defaultResponseHeaders,
        body: {},
      }],
      ['/repos/my-repo/git/commits', {
        headers: defaultResponseHeaders,
        body: {},
      }],
      ['/repos/my-repo/git/refs', {
        headers: defaultResponseHeaders,
        body: {},
      }],
      ['/repos/my-repo/pulls', (url, pullRequest) => {
        prBaseBranch = JSON.parse(pullRequest.body).base;
        return {
          headers: defaultResponseHeaders,
          body: { head: { sha: 'cbd' } },
        };
      }],
      ['/user', {
        headers: defaultResponseHeaders,
        body: {},
      }],
      ['/repos/my-repo/git/blobs', {
        headers: defaultResponseHeaders,
        body: {},
      }],
      ['/repos/my-repo/git/refs/meta/_netlify_cms', {
        headers: defaultResponseHeaders,
        body: { object: {} },
      }],
    ];
    responses.forEach(([url, response, options]) =>
      mockRequest(api.api_root)(url, response, options));
 
    return expect(
      api.editorialWorkflowGit(null, { slug: 'entry', sha: 'abc' }, null, {})
        .then(() => prBaseBranch)
    ).resolves.toEqual('gh-pages');
  });

  it('should correctly update a tree', () => {
    const api = new API({ branch: 'gh-pages', repo: 'my-repo' });
    const responses = [
      ['/repos/my-repo/git/trees/abc', {
        headers: defaultResponseHeaders,
        body: {
          sha: 'abc',
          tree: [
            {
              path: 'file.txt',
              mode: '100644',
              type: 'blob',
              size: 30,
              sha: 'bcd',
            },
            {
              path: 'subdir',
              mode: '040000',
              type: 'tree',
              'sha': 'cde',
            },
          ],
        },
      }],
      ['/repos/my-repo/git/trees/cde', {
        headers: defaultResponseHeaders,
        body: {
          sha: 'cde',
          tree: [
            {
              path: 'subdir/file.txt',
              mode: "100644",
              type: "blob",
              size: 132,
              sha: "def",
            },
          ],
        },
      }],
      ['/repos/my-repo/git/trees', (url, request) => {
        const treeData = JSON.parse(request.body);
        const expectedRequests = {
          cde: {
            expectedTree: [{
              path: 'file2.txt',
              mode: '100644',
              type: 'blob',
              sha: 'ghi',
            }],
            responseBody: {
              sha: 'efg',
            },
          },
          abc: {
            expectedTree: [{
              path: 'subdir',
              mode: '040000',
              type: 'tree',
              sha: 'efg',
              parentSha: 'cde',
            }],
            responseBody: {
              sha: 'fgh',
            },
          },
        };
        if (treeData.base_tree && expectedRequests[treeData.base_tree]) {
          if (isMatch(treeData.tree, expectedRequests[treeData.base_tree].expectedTree)) {
            return {
              headers: defaultResponseHeaders,
              body: expectedRequests[treeData.base_tree].responseBody,
            };
          }

          throw new Error(`Received bad update to tree:
Received tree: ${ JSON.stringify(treeData.tree, null, 2) }
Expected tree: ${ JSON.stringify(expectedRequests[treeData.base_tree].expectedTree, null, 2) }`);
        }

        throw new Error(`Received update to unexpected tree: ${ treeData.base_tree }:
${ JSON.stringify(treeData, null, 2) }`);
      }, {
        fetchMockOptions: { method: "POST" },
      }],
    ];
    responses.forEach(([url, response, options]) =>
      mockRequest(api.api_root, url, response, options));

    return expect(
      api.updateTree('abc', '/', {
        subdir: {
          'file2.txt': {
            file: true,
            path: 'subdir/file2.txt',
            raw: 'file 2',
            sha: 'ghi',
            slug: 'file2',
            uploaded: true,
          },
        },
      })
    ).resolves.toMatchObject({
      path: '/',
      sha: 'fgh',
      parentSha: 'abc',
    });
  });
});
