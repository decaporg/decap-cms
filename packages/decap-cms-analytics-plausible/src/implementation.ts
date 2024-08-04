import { BaseAnalyticsService } from 'decap-cms-lib-analytics';

import type { Config, Pageview } from 'decap-cms-lib-analytics';

export class PlausibleAnalytics extends BaseAnalyticsService {
  constructor(config: Config) {
    super(config);

    if (!config.apiKey) {
      throw new Error('Plausible API key is required');
    }

    if (!config.appId) {
      throw new Error('Plausible site ID is required');
    }

    this.apiEndpoint = `https://plausible.io/api/v1/stats`;
  }

  async getPageviews(period: string): Promise<Pageview[]> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    const params = new URLSearchParams({
      site_id: this.apiEndpoint,
      period,
      metrics: 'pageviews',
    });

    const response = await fetch(`${this.apiEndpoint}/timeseries?${params}`, {
      headers,
    });

    const data = await response.json();
    return this.parsePageviews(data);
  }

  parsePageviews(data: any): Pageview[] {
    return data.results;
  }
}
