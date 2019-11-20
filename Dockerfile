FROM node:13.1.0-stretch-slim as build-deps
WORKDIR /usr/src/app
# Set up working directories for Yarn
ENV HOME /usr/src/app
ENV YARN_FOLDER ${HOME}/.yarn
ENV YARN_CACHE_FOLDER ${HOME}/.yarn_cache
RUN mkdir -p\
  ${HOME}/.yarn\
  ${HOME}/.yarn_cache
# Copy Yarn files
COPY package.json yarn.lock ./
COPY . ./
# RUN yarn --global-folder ${YARN_FOLDER} --cache-folder ${YARN_CACHE_FOLDER} &&\
#   yarn bootstrap
# RUN yarn &&\
#   lerna init &&\
#   yarn bootstrap
# RUN yarn add --dev @emotion/styled-base gotrue-js jwt-decode react-immutable-proptypes
# RUN yarn build
