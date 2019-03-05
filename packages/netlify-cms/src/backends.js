import CMS from 'netlify-cms-core/src';
import GitHubBackend from 'netlify-cms-backend-github/src';
import GitlabBackend from 'netlify-cms-backend-gitlab/src';
import GatewayBackend from 'netlify-cms-backend-git-gateway/src';
import BitbucketBackend from 'netlify-cms-backend-bitbucket/src';
import TestBackend from 'netlify-cms-backend-test/src';

CMS.registerBackend('git-gateway', GatewayBackend.Control);
CMS.registerBackend('github', GitHubBackend.Control);
CMS.registerBackend('gitlab', GitlabBackend.Control);
CMS.registerBackend('bitbucket', BitbucketBackend.Control);
CMS.registerBackend('test-repo', TestBackend.Control);
