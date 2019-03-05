import { registerBackend } from 'netlify-cms-core/src';
import { NetlifyCmsBackendGithub } from 'netlify-cms-backend-github/src';
import { NetlifyCmsBackendGitlab } from 'netlify-cms-backend-gitlab/src';
import { NetlifyCmsBackendGitGateway } from 'netlify-cms-backend-git-gateway/src';
import { NetlifyCmsBackendBitbucket } from 'netlify-cms-backend-bitbucket/src';
import { NetlifyCmsBackendTest } from 'netlify-cms-backend-test/src';

registerBackend('git-gateway', NetlifyCmsBackendGitGateway.Control);
registerBackend('github', NetlifyCmsBackendGithub.Control);
registerBackend('gitlab', NetlifyCmsBackendGitlab.Control);
registerBackend('bitbucket', NetlifyCmsBackendBitbucket.Control);
registerBackend('test-repo', NetlifyCmsBackendTest.Control);
