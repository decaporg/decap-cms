const path = require('path');
const simpleGit = require('simple-git/promise');

const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no';
const GIT_SSL_NO_VERIFY = true;

const getExpectationsFilename = taskData => {
  const { spec, testName } = taskData;
  const basename = `${spec}__${testName}`;
  const fixtures = path.join(__dirname, '..', 'fixtures');
  const filename = path.join(fixtures, `${basename}.json`);

  return filename;
};

const HEADERS_TO_IGNORE = [
  'Date',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'ETag',
  'Last-Modified',
  'X-GitHub-Request-Id',
  'X-NF-Request-ID',
  'X-Request-Id',
  'X-Runtime',
  'RateLimit-Limit',
  'RateLimit-Observed',
  'RateLimit-Remaining',
  'RateLimit-Reset',
  'RateLimit-ResetTime',
  'GitLab-LB',
].map(h => h.toLowerCase());

const transformRecordedData = (expectation, requestBodySanitizer, responseBodySanitizer) => {
  const { httpRequest, httpResponse } = expectation;

  const responseHeaders = {};

  Object.keys(httpResponse.headers)
    .filter(key => !HEADERS_TO_IGNORE.includes(key.toLowerCase()))
    .forEach(key => {
      responseHeaders[key] = httpResponse.headers[key][0];
    });

  let queryString;
  if (httpRequest.queryStringParameters) {
    const { queryStringParameters } = httpRequest;

    queryString = Object.keys(queryStringParameters)
      .map(key => `${key}=${queryStringParameters[key]}`)
      .join('&');
  }

  const body = requestBodySanitizer(httpRequest);
  const responseBody = responseBodySanitizer(httpRequest, httpResponse);

  const cypressRouteOptions = {
    body,
    method: httpRequest.method,
    url: queryString ? `${httpRequest.path}?${queryString}` : httpRequest.path,
    headers: responseHeaders,
    response: responseBody,
    status: httpResponse.statusCode,
  };

  return cypressRouteOptions;
};

function getGitClient(repoDir) {
  const git = simpleGit(repoDir).env({ ...process.env, GIT_SSH_COMMAND, GIT_SSL_NO_VERIFY });
  return git;
}

module.exports = {
  getExpectationsFilename,
  transformRecordedData,
  getGitClient,
};
