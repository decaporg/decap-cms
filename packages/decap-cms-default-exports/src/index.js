// eslint-disable-next-line @emotion/no-vanilla
import {
  CacheProvider,
  ClassNames,
  css,
  Global,
  jsx,
  keyframes,
  ThemeContext,
  withEmotionCache,
} from '@emotion/react';
import EmotionStyled from '@emotion/styled';
import Immutable from 'immutable';
import Lodash from 'lodash/lodash';
import Moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as UUId from 'uuid';

const EmotionCore = {
  css,
  withEmotionCache,
  CacheProvider,
  ThemeContext,
  jsx,
  Global,
  keyframes,
  ClassNames,
};
export const DecapCmsDefaultExports = {
  EmotionCore,
  EmotionStyled,
  Immutable,
  ImmutablePropTypes,
  Lodash,
  Moment,
  PropTypes,
  React,
  ReactDOM,
  UUId,
};
