import cms from 'netlify-cms-core/src';
import { GitHubBackend } from 'netlify-cms-backend-github/src';
import { GitLabBackend } from 'netlify-cms-backend-gitlab/src';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway/src';
import { TestBackend } from 'netlify-cms-backend-test/src';

console.log(cms);
const { registerBackend } = cms;

registerBackend('git-gateway', GitGatewayBackend);
registerBackend('github', GitHubBackend);
registerBackend('gitlab', GitLabBackend);
registerBackend('test-repo', TestBackend);
