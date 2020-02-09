const crypto = require('crypto');
const axios = require('axios');

const verifySignature = event => {
  const timestamp = Number(event.headers['x-slack-request-timestamp']);
  const time = Math.floor(Date.now() / 1000);
  if (time - timestamp > 60 * 5) {
    throw new Error(`Failed verifying signature. Timestamp too old '${timestamp}'`);
  }
  const body = event.body;
  const sigString = `v0:${timestamp}:${body}`;
  const actualSignature = event.headers['x-slack-signature'];
  const secret = process.env.SLACK_SIGNING_SECRET;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(sigString, 'utf8')
    .digest('hex');

  const expectedSignature = `v0=${hash}`;

  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(actualSignature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8'),
  );

  if (!signaturesMatch) {
    throw new Error(
      `Signatures don't match. Expected: '${expectedSignature}', actual: '${actualSignature}'`,
    );
  }
};

exports.handler = async function(event) {
  try {
    console.log(JSON.stringify(event, null, 2));
    verifySignature(event);

    const params = new URLSearchParams(event.body);
    const command = params.get('command');
    const userId = params.get('user_id');

    const allowedUsers = (process.env.ALLOWED_USERS || '').split(',');
    if (!allowedUsers.includes(userId)) {
      throw new Error(`User '${params.get('user_name')}' is not allowed to run command`);
    }

    const expectedCommand = process.env.PUBLISH_COMMAND;
    if (expectedCommand && expectedCommand == command) {
      const githubToken = process.env.GITHUB_TOKEN;
      const repo = process.env.GITHUB_REPO;
      await axios({
        headers: { Authorization: `token ${githubToken}` },
        method: 'post',
        url: `https://api.github.com/repos/${repo}/dispatches`,
        data: { event_type: 'on-demand-github-action' },
      });
      const message = 'Dispatched event to GitHub';
      return { status: 200, body: message };
    } else {
      throw new Error(`Command is not allowed. Expected: ${expectedCommand}. Actual: ${command}`);
    }
  } catch (e) {
    console.log(e);
    const response = {
      body: 'Unauthorized',
      status: 401,
    };
    return response;
  }
};
