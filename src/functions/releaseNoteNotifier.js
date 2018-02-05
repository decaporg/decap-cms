const axios = require('axios')
const exec = require('child_process').exec;
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN
const GITHUB_USERNAME = process.env.GITHUB_USERNAME
const GITTER_TOKEN = process.env.GITTER_TOKEN
const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

function getReleaseData() {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/releases/latest?user=${GITHUB_USERNAME}&token=${GITHUB_API_TOKEN}`
  return axios.get(url, config).then(function(response) {
    return response.data
  })
}

function createReleasePost(releaseData, msg) {
  const tag = releaseData["tag_name"];
  const content = {
    "message": msg,
    "committer": {
      "name": "netlify-bot",
      "email": "bot@netlify.com"
    },
    "content": releaseData["body"]
  }
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/website/site/content/releases/${tag}.md?token=${GITHUB_API_TOKEN}&user=${GITHUB_USERNAME}`
  return axios.put(url, content).then(function(response) {
    console.log(response);
  })
  .catch((e) => {
    console.log(e);
  })
}

function sendToGitter(msg) {
  // Gitter does not allow posting message through http, POST requests must be
  // curl'd
  exec(
    `curl -X POST -i -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer 168ad35a89384114bb377a52f51449b1c7ee62a4" "https://api.gitter.im/v1/rooms/5a5518cbd73408ce4f873a2d/chatMessages" -d '{"text":"I am testing my Netlify Function to see if it fires and it does 😻"}'`
  )
}

function sendTweet(msg) {
  twitterClient.post('statuses/update', {status: msg},  function(error, tweet, response) {
    if(error) throw error;
    console.log(tweet);
    console.log(response);
  });
}

export function handler(event, context, callback) {
  const body = JSON.parse(event.body)

  getReleaseData().then((response) => {
    const parsedData = JSON.parse(value);
    const msg = `New release ${parsedData['tag_name']} is shipped! 🚀 ${parsedData['url']}`
    sendTweet(msg);
    sendToGitter(msg)
    createReleasePost(parsedData, msg);

    return {
      status: "200"
    }
  })
  .catch((e) => {
    console.log(e)
    return callback(e)
  })
}

