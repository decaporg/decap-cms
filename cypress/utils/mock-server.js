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

  let recorded = await promise;
  recorded = recorded.filter(({ httpRequest }) => {
    const { Host = [] } = httpRequest.headers;

    // Host is an array of strings
    return (
      Host.includes('api.github.com') ||
      (Host.includes('gitlab.com') && httpRequest.path.includes('api/v4')) ||
      Host.includes('api.bitbucket.org') ||
      Host.some(host => host.includes('netlify.com')) ||
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
