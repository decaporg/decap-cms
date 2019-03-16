import { registerBackend } from 'netlify-cms-core/src';
import { Control as NetlifyCmsBackendGithub } from 'netlify-cms-backend-github/src';
import { Control as NetlifyCmsBackendGitlab } from 'netlify-cms-backend-gitlab/src';
import { Control as NetlifyCmsBackendGitGateway } from 'netlify-cms-backend-git-gateway/src';
import { Control as NetlifyCmsBackendBitbucket } from 'netlify-cms-backend-bitbucket/src';
import { Control as NetlifyCmsBackendTest } from 'netlify-cms-backend-test/src';

registerBackend('git-gateway', NetlifyCmsBackendGitGateway);
registerBackend('github', NetlifyCmsBackendGithub);
registerBackend('gitlab', NetlifyCmsBackendGitlab);
registerBackend('bitbucket', NetlifyCmsBackendBitbucket);
registerBackend('test-repo', NetlifyCmsBackendTest);
