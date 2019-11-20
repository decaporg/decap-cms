#!/bin/bash
# Exit on errors
set -e

# Variables
DOCKER_IMAGE_PREFIX="linaroits"
DOCKER_IMAGE_NAME="node-netlify-cmd-builder"
# DOCKER_IMAGE_VERSION="13.1.0-stretch-slim"
DOCKER_IMAGE_VERSION="$(git rev-parse --short HEAD)"
HOSTNAME="$(hostname)"

# Build Docker Image
echo docker build --compress --memory 4GB --pull --rm --tag "${DOCKER_IMAGE_PREFIX}"/"${DOCKER_IMAGE_NAME}":"${DOCKER_IMAGE_VERSION}" ./
# Build packages within image
echo docker run --cap-drop=all --memory=4GB --rm -i -t -v ./:/usr/src/app -v /etc/group:/etc/group:ro -v /etc/passwd:/etc/passwd:ro -u="$(id -u)":"$(id -g)" -w /usr/src/app --hostname="${HOSTNAME}"-netlify-builder-13-1-0 --name netlify_builder "${DOCKER_IMAGE_PREFIX}"/"${DOCKER_IMAGE_NAME}":"${DOCKER_IMAGE_VERSION}" yarn bootstrap
