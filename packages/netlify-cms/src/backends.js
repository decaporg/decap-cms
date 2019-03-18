import { registerBackend } from 'netlify-cms-core';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway';
import { BitbucketBackend } from 'netlify-cms-backend-bitbucket';
import { TestBackend } from 'netlify-cms-backend-test';

registerBackend('git-gateway', GitGatewayBackend);
registerBackend('github', GitHubBackend);
registerBackend('gitlab', GitLabBackend);
registerBackend('bitbucket', BitbucketBackend);
registerBackend('test-repo', TestBackend);
