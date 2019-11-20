#!/bin/bash
# Exit on errors
set -e
set -x

# Variables
DOCKER_SOURCE_IMAGE="node"
DOCKER_IMAGE_VERSION="13.1.0-stretch-slim"
HOSTNAME="$(hostname)"
USER="$(id -u)"
GROUP="$(id -g)"
CURRENT_DIR="$(pwd)"
DOCKER_WORKDIR="${HOME}"

docker run\
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
 "${DOCKER_SOURCE_IMAGE}":"${DOCKER_IMAGE_VERSION}"\
 /bin/bash -c "${DOCKER_WORKDIR}/build_netlify.sh"
