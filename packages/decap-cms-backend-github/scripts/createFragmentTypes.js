const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_HOST = process.env.GITHUB_HOST || 'https://api.github.com';
const API_TOKEN = process.env.GITHUB_API_TOKEN;

if (!API_TOKEN) {
  throw new Error('Missing environment variable GITHUB_API_TOKEN');
}

fetch(`${API_HOST}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `bearer ${API_TOKEN}` },
  body: JSON.stringify({
    variables: {},
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
})
  .then(result => result.json())
  .then(result => {
    // here we're filtering out any type information unrelated to unions or interfaces
    const filteredData = result.data.__schema.types.filter(type => type.possibleTypes !== null);
    result.data.__schema.types = filteredData;
    fs.writeFile(
      path.join(__dirname, '..', 'src', 'fragmentTypes.js'),
      `module.exports = ${JSON.stringify(result.data)}`,
      err => {
        if (err) {
          console.error('Error writing fragmentTypes file', err);
        } else {
          console.log('Fragment types successfully extracted!');
        }
      },
    );
  });
