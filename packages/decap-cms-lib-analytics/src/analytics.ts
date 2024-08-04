export type Period =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_365_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'all_time';

export type Interval = 'day' | 'week' | 'month' | 'year';

export interface Pageview {
  date: string;
  pageviews: number;
}

export interface Config {
  appId: string;
  apiKey: string;
  apiEndpoint: string;
}

export interface AnalyticsService<T = any> {
  appId: string;
  apiKey: string;
  apiEndpoint: string;
  getPageviews(period: Period, interval: Interval): Promise<Pageview[]>;
  parsePageviews(data: T): Pageview[];
}

export class BaseAnalyticsService implements AnalyticsService {
  appId: string;
  apiKey: string;
  apiEndpoint: string;

  constructor(config: Config) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;

    return this;
  }

  async getPageviews(period: Period, interval: Interval): Promise<Pageview[]> {
    throw new Error('Method not implemented.');
  }

  parsePageviews(data: any): Pageview[] {
    throw new Error('Method not implemented.');
  }
}
