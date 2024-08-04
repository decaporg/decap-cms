import { produce } from 'immer';

import {
  ANALYTICS_CREATE,
  ANALYTICS_PAGEVIEWS_REQUEST,
  ANALYTICS_PAGEVIEWS_SUCCESS,
  ANALYTICS_PAGEVIEWS_FAILURE,
} from '../actions/analytics';

import type { AnalyticsAction } from '../actions/analytics';
import type { Analytics, CmsConfig } from '../types/redux';

const defaultState = {
  pageviews: [],
  period: '7d',
  interval: 'day',
  isLoading: false,
};

const analytics = produce((state: Analytics, action: AnalyticsAction) => {
  switch (action.type) {
    case ANALYTICS_CREATE:
      state.implementation = action.payload.implementation;
      break;
    case ANALYTICS_PAGEVIEWS_REQUEST:
      state.isLoading = true;
      state.period = action.payload.period;
      state.interval = action.payload.interval;
      break;
    case ANALYTICS_PAGEVIEWS_SUCCESS:
      state.pageviews = action.payload.pageviews;
      state.isLoading = false;
      break;
    case ANALYTICS_PAGEVIEWS_FAILURE:
      state.isLoading = false;
      break;
    default:
      return state;
  }
}, defaultState);

export function selectPageviews(state: CmsConfig) {
  return state.analytics?.pageviews;
}

export function selectPeriod(state: CmsConfig) {
  return state.analytics?.period;
}

export function selectInterval(state: CmsConfig) {
  return state.analytics?.interval;
}

export default analytics;
