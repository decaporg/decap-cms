import { BaseAnalyticsService } from 'decap-cms-lib-analytics';

import type { AnalyticsService, Config, Pageview, Period, Interval } from 'decap-cms-lib-analytics';

export class SimpleAnalytics extends BaseAnalyticsService implements AnalyticsService {
  constructor({ options = { config: {} } } = {}) {
    const { api_key: apiKey, app_id: appId } = options.config;

    super({
      appId,
      apiKey,
      apiEndpoint: `https://simpleanalytics.com/${appId}.json?version=5&info=false`,
    });

    // if (!apiKey) {
    //   throw new Error('SimpleAnalytics API key is required');
    // }

    if (!appId) {
      throw new Error('SimpleAnalytics site ID is required');
    }

    return this;
  }

  async getPageviews(period: Period, interval: Interval): Promise<Pageview[]> {
    const headers = {
      'Content-Type': 'application/json',
      'Api-Key': this.apiKey,
    };

    const params = new URLSearchParams({
      fields: 'histogram',
      interval,
    });

    const response = await fetch(`${this.apiEndpoint}&${params}`, {
      headers,
    });

    const data = await response.json();
    return this.parsePageviews(data);
  }

  parsePageviews(data: any): Pageview[] {
    return data.histogram.map((item: any) => ({
      date: item.date,
      pageviews: item.pageviews,
    }));
  }
}
