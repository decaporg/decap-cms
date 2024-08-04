import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { Period, Interval, Pageview } from 'decap-cms-lib-analytics';
import type { AnalyticsInstance, State } from '../types/redux';

export const ANALYTICS_CREATE = 'ANALYTICS_CREATE';
export const ANALYTICS_PAGEVIEWS_REQUEST = 'ANALYTICS_PAGEVIEWS_REQUEST';
export const ANALYTICS_PAGEVIEWS_SUCCESS = 'ANALYTICS_PAGEVIEWS_SUCCESS';
export const ANALYTICS_PAGEVIEWS_FAILURE = 'ANALYTICS_PAGEVIEWS_FAILURE';

export function createAnalytics(instance: AnalyticsInstance) {
  const implementation = {
    appId: instance.appId,
    apiKey: instance.apiKey,
    apiEndpoint: instance.apiEndpoint,
    getPageviews: instance.getPageviews || (() => undefined),
    parsePageviews: instance.parsePageviews || (() => undefined),
  };
  return { type: ANALYTICS_CREATE, payload: { implementation } } as const;
}

export function pageviewsLoading(period: Period, interval: Interval) {
  return { type: ANALYTICS_PAGEVIEWS_REQUEST, payload: { period, interval } } as const;
}

export function pageviewsLoaded(pageviews: Pageview[]) {
  return {
    type: ANALYTICS_PAGEVIEWS_SUCCESS,
    payload: { pageviews },
  } as const;
}

export function pageviewsFailed(error: Error) {
  return { type: ANALYTICS_PAGEVIEWS_FAILURE, payload: { error } } as const;
}

export function fetchPageviews(period: Period, interval: Interval) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    dispatch(pageviewsLoading(period, interval));

    const state = getState();
    const { implementation } = state.analytics;

    try {
      const pageviews = await implementation.getPageviews(period, interval);

      dispatch(pageviewsLoaded(pageviews));
    } catch (error) {
      dispatch(pageviewsFailed(error));
    }
  };
}

export type AnalyticsAction = ReturnType<
  typeof createAnalytics | typeof pageviewsLoading | typeof pageviewsLoaded | typeof pageviewsFailed
>;
