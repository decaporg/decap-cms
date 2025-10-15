#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 18
echo "Node version in script: $(node -v)"
echo "Node path in script: $(which node)"
echo "npm version in script: $(npm -v)"
echo "npm path in script: $(which npm)"

TEST_PROJECT_PATH="./dev-test-npm/package-integrity-check"

# 1. Clean and build all packages
npm run clean
npm run build

# 2. Create a fresh test project
rm -rf "$TEST_PROJECT_PATH"
mkdir -p "$TEST_PROJECT_PATH"
cd "$TEST_PROJECT_PATH"
npm init -y

# 3. Pack all packages and install them
cd ../../
./scripts/pack-and-install.sh "$TEST_PROJECT_PATH"

# 4. Run smoke tests (example: import main exports)
cd "$TEST_PROJECT_PATH"
echo "console.log('Integrity check: importing DecapCmsCore...'); require('decap-cms-core');" > smoke-test.js
node smoke-test.js

# 5. Optionally, run unit/e2e tests
# npm test

echo "Integrity check completed successfully!"
