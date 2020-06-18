const { mockServerClient } = require('mockserver-client');
const mockserver = require('mockserver-node');

const PROXY_PORT = 1080;
const PROXY_HOST = 'localhost';

const start = () =>
  mockserver.start_mockserver({
    serverPort: PROXY_PORT,
  });

const stop = () =>
  mockserver.stop_mockserver({
    serverPort: PROXY_PORT,
  });

const retrieveRecordedExpectations = async () => {
  const promise = new Promise((resolve, reject) => {
    mockServerClient(PROXY_HOST, PROXY_PORT)
      .retrieveRecordedExpectations({})
      .then(resolve, reject);
  });

  let timeout;
  const timeoutPromise = new Promise(resolve => {
    timeout = setTimeout(() => {
      console.warn('retrieveRecordedExpectations timeout');
      resolve([]);
    }, 3000);
  });

  let recorded = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeout);

  recorded = recorded.filter(({ httpRequest }) => {
    const { Host = [] } = httpRequest.headers;

    // Host is an array of strings
    return (
      Host.includes('api.github.com') ||
      (Host.includes('gitlab.com') && httpRequest.path.includes('api/v4')) ||
      Host.includes('api.bitbucket.org') ||
      (Host.includes('bitbucket.org') && httpRequest.path.includes('info/lfs')) ||
      Host.includes('api.media.atlassian.com') ||
      Host.some(host => host.includes('netlify.com')) ||
      Host.some(host => host.includes('netlify.app')) ||
      Host.some(host => host.includes('s3.amazonaws.com'))
    );
  });

  return recorded;
};

const resetMockServerState = async () => {
  const promise = new Promise((resolve, reject) => {
    mockServerClient(PROXY_HOST, PROXY_PORT)
      .reset()
      .then(resolve, reject);
  });

  await promise;
};

module.exports = {
  start,
  stop,
  resetMockServerState,
  retrieveRecordedExpectations,
};
