import cms from 'netlify-cms-core/src';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway/src';
import { TestBackend } from 'netlify-cms-backend-test/src';

const { registerBackend } = cms;

registerBackend('git-gateway', GitGatewayBackend);
registerBackend('test-repo', TestBackend);
