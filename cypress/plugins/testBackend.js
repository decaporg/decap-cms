const { updateConfig } = require('../utils/config');
const { merge } = require('lodash');

async function setupTestBackend(options) {
  await updateConfig(current => {
    merge(current, options);
  });

  return null;
}

module.exports = {
  setupTestBackend,
};
