import { produce } from 'immer';

import {
  ANALYTICS_CREATE,
  ANALYTICS_METRICS_REQUEST,
  ANALYTICS_METRICS_SUCCESS,
  ANALYTICS_METRICS_FAILURE,
} from '../actions/analytics';

import type { AnalyticsAction } from '../actions/analytics';
import type { Analytics, CmsConfig } from '../types/redux';

const defaultState = {
  metrics: [],
  period: 'today',
  interval: 'day',
  isLoading: false,
};

const analytics = produce((state: Analytics, action: AnalyticsAction) => {
  switch (action.type) {
    case ANALYTICS_CREATE:
      state.implementation = action.payload.implementation;
      break;
    case ANALYTICS_METRICS_REQUEST:
      state.isLoading = true;
      state.period = action.payload.period;
      break;
    case ANALYTICS_METRICS_SUCCESS:
      state.metrics = action.payload.metrics;
      state.interval = action.payload.interval;
      state.isLoading = false;
      break;
    case ANALYTICS_METRICS_FAILURE:
      state.isLoading = false;
      break;
    default:
      return state;
  }
}, defaultState);

export function selectMetrics(state: CmsConfig) {
  return state.analytics?.metrics;
}

export function selectPeriod(state: CmsConfig) {
  return state.analytics?.period;
}

export function selectInterval(state: CmsConfig) {
  return state.analytics?.interval;
}

export function selectIsLoading(state: CmsConfig) {
  return state.analytics?.isLoading;
}

export default analytics;
