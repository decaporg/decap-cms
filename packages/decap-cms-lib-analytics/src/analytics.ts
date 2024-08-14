export const PERIODS = [
  'today',
  'last24Hours',
  'thisWeek',
  'last7Days',
  'thisMonth',
  'last30Days',
  'thisYear',
  'allTime',
] as const;

export type Period = (typeof PERIODS)[number];

export type Interval = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Metric {
  date: string;
  visitors: number;
}

export interface Config {
  site_id: string;
  api_key: string;
  api_endpoint: string;
  is_public: boolean;
}

export interface AnalyticsService<T = any> {
  siteId: string;
  apiKey?: string;
  apiEndpoint: string;
  isPublic: boolean;

  getMetrics(period: Period): Promise<{ metrics: Metric[]; interval: Interval }>;
}

export abstract class BaseAnalyticsService<T = any> implements AnalyticsService<T> {
  siteId: string;
  apiKey?: string;
  apiEndpoint: string;
  isPublic: boolean;

  constructor(config: Config) {
    if (this.constructor === BaseAnalyticsService) {
      throw new Error('Cannot instantiate an abstract class');
    }

    this.siteId = config.site_id;
    this.apiKey = config.api_key;
    this.apiEndpoint = config.api_endpoint;
    this.isPublic = config.is_public;

    return this;
  }

  abstract getMetrics(period: Period): Promise<{ metrics: Metric[]; interval: Interval }>;

  protected abstract parseMetrics(data: T): Metric[];

  abstract parseDateRange(period: Period): {
    start: string;
    end: string;
    interval: Interval;
  };
}
