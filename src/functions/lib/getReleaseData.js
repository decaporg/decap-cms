const axios = require('axios')
const config = require('./axios-config')
const GITHUB_REPO = process.env.GITHUB_REPO

module.exports = function getPullRequestData(number) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/pulls/${number}`
  return axios.get(url, config).then(function(response) {
    return response.data
  })
}
