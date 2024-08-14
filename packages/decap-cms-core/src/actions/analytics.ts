import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnalyticsService, Period, Metric, Interval } from 'decap-cms-lib-analytics';
import type { State } from '../types/redux';

export const ANALYTICS_CREATE = 'ANALYTICS_CREATE';
export const ANALYTICS_METRICS_REQUEST = 'ANALYTICS_METRICS_REQUEST';
export const ANALYTICS_METRICS_SUCCESS = 'ANALYTICS_METRICS_SUCCESS';
export const ANALYTICS_METRICS_FAILURE = 'ANALYTICS_METRICS_FAILURE';

export function createAnalytics(instance: AnalyticsService) {
  const implementation = {
    siteId: instance.siteId,
    apiKey: instance.apiKey,
    apiEndpoint: instance.apiEndpoint,
    isPublic: instance.isPublic,
    getMetrics: instance.getMetrics || (() => undefined),
    parseMetrics: instance.parseMetrics || (() => undefined),
  };
  return { type: ANALYTICS_CREATE, payload: { implementation } } as const;
}

export function metricsLoading(period: Period) {
  return { type: ANALYTICS_METRICS_REQUEST, payload: { period } } as const;
}

export function metricsLoaded(metrics: Metric[], period: Period, interval: Interval) {
  return {
    type: ANALYTICS_METRICS_SUCCESS,
    payload: { metrics, period, interval },
  } as const;
}

export function metricsFailed(error: Error) {
  return { type: ANALYTICS_METRICS_FAILURE, payload: { error } } as const;
}

export function fetchMetrics(period: Period) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    dispatch(metricsLoading(period));

    const state = getState();
    const { implementation } = state.analytics;

    try {
      const { metrics, interval } = await implementation.getMetrics(period);

      dispatch(metricsLoaded(metrics, period, interval));
    } catch (error) {
      dispatch(metricsFailed(error));
    }
  };
}

export type AnalyticsAction = ReturnType<
  typeof createAnalytics | typeof metricsLoading | typeof metricsLoaded | typeof metricsFailed
>;
