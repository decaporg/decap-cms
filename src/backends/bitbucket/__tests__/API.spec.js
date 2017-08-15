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

const defaultResponseHeaders = { "Content-Type": "application/json; charset=utf-8" };

afterEach(() => fetchMock.restore());

describe('bitbucket API', () => {

  it('should list the files in a directory', () => {
    const api = new API({ branch: 'test-branch', repo: 'test-user/test-repo' });
    mockRequest(api.api_root)(`${ api.repoURL }/src/${ api.branch }/test-directory`, {
      headers: defaultResponseHeaders,
      body: {
        "pagelen": 10,
        "values": [
          {
            "path": "test-directory/octokit.rb",
            "attributes": [],
            "type": "commit_file",
            "size": 625
          }
        ],
        "page": 1,
        "size": 1
      }
    });
    return expect(api.listFiles('test-directory')).resolves.toMatchObject([
      {
        "path": "test-directory/octokit.rb",
        "attributes": [],
        "type": "commit_file",
        "size": 625
      }
    ]);
  });

  it('should throw error if there no files to list', () => {
    const api = new API({ branch: 'test-branch', repo: 'test-user/test-repo' });
    mockRequest(api.api_root)(`${ api.repoURL }/src/${ api.branch }/test-directory`, {
      headers: defaultResponseHeaders,
      body: {
        "pagelen": 10,
        "page": 1,
        "size": 1
      }
    });
    return expect(api.listFiles('test-directory')).rejects.toBeDefined();
  });

});
