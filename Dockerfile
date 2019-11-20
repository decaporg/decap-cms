FROM node:13.1.0-stretch-slim as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
COPY . ./
RUN yarn &&\
  yarn bootstrap
# RUN yarn &&\
#   lerna init &&\
#   yarn bootstrap
# RUN yarn add --dev @emotion/styled-base gotrue-js jwt-decode react-immutable-proptypes
# RUN yarn build
