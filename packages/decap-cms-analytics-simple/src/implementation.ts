import dayjs from 'dayjs';
import { BaseAnalyticsService } from 'decap-cms-lib-analytics';

import type { AnalyticsService, Config, Metric, Period, Interval } from 'decap-cms-lib-analytics';

type Response = {
  histogram: {
    date: string;
    pageviews: number;
    visitors: number;
  }[];
};

type Params = {
  version: '1' | '2' | '3' | '4' | '5';
  start?: string;
  end?: string;
  info?: 'true' | 'false';
  fields: 'pageviews' | 'visitors' | 'histogram';
};

export class SimpleAnalytics extends BaseAnalyticsService implements AnalyticsService<Response> {
  siteId: string;
  apiKey?: string;
  apiEndpoint: string;
  isPublic: boolean;

  constructor({ config }: { config: Config }) {
    super(config);

    this.siteId = config.site_id;
    this.apiKey = config.api_key;
    this.apiEndpoint = config.api_endpoint || `https://simpleanalytics.com/${this.siteId}.json`;
    this.isPublic = config.is_public || false;

    return this;
  }

  static parseDateRange(period: Period): {
    start: string;
    end: string;
    interval: Interval;
  } {
    const end = dayjs().format('YYYY-MM-DD');
    let start = dayjs().subtract(1, 'week').format('YYYY-MM-DD');
    let interval: Interval = 'day';

    switch (period) {
      case 'today':
        start = dayjs().format('YYYY-MM-DD');
        interval = 'hour';
        break;
      case 'last24Hours':
        start = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        interval = 'hour';
        break;
      case 'thisWeek':
        start = dayjs().startOf('week').format('YYYY-MM-DD');
        break;
      case 'last7Days':
        start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        break;
      case 'thisMonth':
        start = dayjs().startOf('month').format('YYYY-MM-DD');
        break;
      case 'last30Days':
        start = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        break;
      case 'thisYear':
        start = dayjs().startOf('year').format('YYYY-MM-DD');
        interval = 'month';
        break;
      case 'allTime':
        start = dayjs('2021-01-01').format('YYYY-MM-DD');
        interval = 'month';
        break;
    }

    return { start, end, interval };
  }

  parseMetrics(data: Response): Metric[] {
    return data.histogram.map(item => ({
      date: item.date,
      visitors: item.visitors,
    }));
  }

  async getMetrics(period: Period): Promise<{ metrics: Metric[]; interval: Interval }> {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (!this.isPublic && this.apiKey) {
      headers['Api-Key'] = this.apiKey;
    }

    const { start, end, interval } = SimpleAnalytics.parseDateRange(period);

    const params = new URLSearchParams({
      version: '5',
      info: 'false',
      fields: 'histogram',
      start,
      end,
      interval,
    } as Params);

    const url = new URL(this.apiEndpoint);
    url.search = params.toString();

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      metrics: this.parseMetrics(data),
      interval,
    };
  }
}
