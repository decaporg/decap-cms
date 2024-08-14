import { once } from 'lodash';

import { getAnalytics } from './lib/registry';
import { store } from './redux';
import { configFailed } from './actions/config';
import { createAnalytics } from './actions/analytics';

const initializeAnalytics = once(async function initializeAnalytics(name, config) {
  const analytics = getAnalytics(name);

  if (!analytics) {
    const err = new Error(
      `Missing analytics provider '${name}'. Please use 'registerAnalytics' to register it.`,
    );

    store.dispatch(configFailed(err));
  } else {
    const instance = await analytics.init({ config });
    store.dispatch(createAnalytics(instance));
  }
});

store.subscribe(() => {
  const state = store.getState();

  if (state) {
    const analyticsName = state.config.analytics?.name;

    if (analyticsName && !state.analytics.implementation) {
      const analyticsConfig = state.config.analytics;
      initializeAnalytics(analyticsName, analyticsConfig);
    }
  }
});
