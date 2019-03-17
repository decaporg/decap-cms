import { registerBackend } from 'netlify-cms-core';
import { Control as NetlifyCmsBackendGithub } from 'netlify-cms-backend-github';
import { Control as NetlifyCmsBackendGitlab } from 'netlify-cms-backend-gitlab';
import { Control as NetlifyCmsBackendGitGateway } from 'netlify-cms-backend-git-gateway';
import { Control as NetlifyCmsBackendBitbucket } from 'netlify-cms-backend-bitbucket';
import { Control as NetlifyCmsBackendTest } from 'netlify-cms-backend-test';

registerBackend('git-gateway', NetlifyCmsBackendGitGateway);
registerBackend('github', NetlifyCmsBackendGithub);
registerBackend('gitlab', NetlifyCmsBackendGitlab);
registerBackend('bitbucket', NetlifyCmsBackendBitbucket);
registerBackend('test-repo', NetlifyCmsBackendTest);
