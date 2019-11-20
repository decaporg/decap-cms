#!/bin/bash
# Exit on errors
set -e
set -x

# Variables
# DOCKER_IMAGE_PREFIX="linaroits"
# DOCKER_IMAGE_NAME="node-netlify-cmd-builder"
# DOCKER_IMAGE_VERSION="13.1.0-stretch-slim"
DOCKER_IMAGE_VERSION="$(git rev-parse --short HEAD)"
HOSTNAME="$(hostname)"
USER="$(id -u)"
GROUP="$(id -g)"
DOCKER_WORKDIR="/usr/src/app"

# Build Docker Image
# docker build --compress --memory 4GB --pull --rm --tag "${DOCKER_IMAGE_PREFIX}"/"${DOCKER_IMAGE_NAME}":"${DOCKER_IMAGE_VERSION}" ./
# # Build packages within image
# docker run --cap-drop=all --memory=4GB --rm -i -t -v ./:/usr/src/app -v /etc/group:/etc/group:ro -v /etc/passwd:/etc/passwd:ro -u="$(id -u)":"$(id -g)" -w /usr/src/app --hostname="${HOSTNAME}"-netlify-builder-13-1-0 --name netlify_builder "${DOCKER_IMAGE_PREFIX}"/"${DOCKER_IMAGE_NAME}":"${DOCKER_IMAGE_VERSION}" yarn bootstrap

docker run\
 -e HOME="${DOCKER_WORKDIR}"\
 -e YARN_FOLDER="${HOME}"/.yarn\
 -e YARN_CACHE_FOLDER="${HOME}"/.yarn_cache\
 --cap-drop=all\
 --memory=4GB\
 --rm\
 -i\
 -t\
 -v ./:/usr/src/app\
 -v /etc/group:/etc/group:ro\
 -v /etc/passwd:/etc/passwd:ro\
 -u "${USER}":"${GROUP}"\
 -w /usr/src/app\
 --hostname="${HOSTNAME}"-netlify-builder-13-1-0\
 --name=netlify_builder\
 "${DOCKER_IMAGE_PREFIX}"/"${DOCKER_IMAGE_NAME}":"${DOCKER_IMAGE_VERSION}"\
 mkdir -p "${HOME}/.yarn" "${HOME}/.yarn_cache" &&\
 yarn --global-folder "${YARN_FOLDER}" --cache-folder "${YARN_CACHE_FOLDER}" &&\
 yarn bootstrap
