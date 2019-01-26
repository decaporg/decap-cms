import cms from 'netlify-cms-core/src';

import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway/src';
cms.registerBackend('git-gateway', GitGatewayBackend);

// #if e = process.env.NODE_ENV !== 'production'
import { TestBackend } from 'netlify-cms-backend-test/src';
cms.registerBackend('test-repo', TestBackend);
// #endif
