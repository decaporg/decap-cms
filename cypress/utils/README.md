## Utilities for integration tests

Utils in this dir must be explicitly included in each spec file, e.g.:

```
import '../utils/dismiss-local-backup';
```

For routines to be executed on all tests, please use the `cypress/plugins.index.js` file instead: https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests.html#Plugin-files
