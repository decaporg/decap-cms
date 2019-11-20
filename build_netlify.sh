#!/bin/bash
set -e
set -x

mkdir -p ".yarn" ".yarn_cache"
yarn --global-folder "$(pwd)/.yarn" --cache-folder "$(pwd)/.yarn_cache"
yarn bootstrap
yarn build
