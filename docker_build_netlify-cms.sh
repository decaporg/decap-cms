#!/bin/bash
# Exit on errors
set -e
set -x

# Variables
# DOCKER_IMAGE_PREFIX="linaroits"
# DOCKER_IMAGE_NAME="node-netlify-cmd-builder"
# DOCKER_IMAGE_VERSION="13.1.0-stretch-slim"
DOCKER_IMAGE="node:13.1.0-stretch-slim"
# DOCKER_IMAGE_VERSION="$(git rev-parse --short HEAD)"
HOSTNAME="$(hostname)"
USER="$(id -u)"
GROUP="$(id -g)"
CURRENT_DIR="$(pwd)"
# DOCKER_WORKDIR="/usr/src/app"
DOCKER_WORKDIR="${HOME}"

docker run\
 -e YARN_FOLDER="${DOCKER_WORKDIR}"/.yarn\
 -e YARN_CACHE_FOLDER="${DOCKER_WORKDIR}"/.yarn_cache\
 --cap-drop=all\
 --memory=4GB\
 --rm\
 -i\
 -v "${CURRENT_DIR}":"${DOCKER_WORKDIR}"\
 -v /etc/group:/etc/group:ro\
 -v /etc/passwd:/etc/passwd:ro\
 -u "${USER}":"${GROUP}"\
 -w "${DOCKER_WORKDIR}"\
 --hostname="${HOSTNAME}"-netlify-builder-13-1-0\
 --name=netlify_builder\
 "${DOCKER_IMAGE}"\
 /bin/bash -c "${DOCKER_WORKDIR}/build_netlify.sh"
