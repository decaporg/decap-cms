import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { type ChartConfig, ChartTooltip, ChartTooltipContent } from 'decap-cms-ui-next';
import { useTheme } from '@emotion/react';
import { translate } from 'react-polyglot';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

import type { Interval, Metric } from 'decap-cms-lib-analytics';

type Props = {
  data: Metric[];
  interval: Interval;
  t: (key: string) => string;
};

function AnalyticsChart({ data, interval, t }: Props) {
  const theme = useTheme();

  const chartConfig = {
    visitors: {
      label: t('dashboard.siteAnalytics.chart.visitors'),
      color: theme.color.primary['900'],
    },
  } satisfies ChartConfig;

  function formatTooltipDateTime(value: string) {
    let format = 'DD MMMM YYYY, HH:mm';

    switch (interval) {
      case 'hour':
        format = 'dddd, D MMMM, HH:mm';
        break;
      case 'day':
        format = 'dddd, D MMMM';
        break;
      case 'month':
        format = 'DD MMMM YYYY';
        break;
      case 'year':
        format = 'MMMM YYYY';
        break;
    }

    return dayjs(value).format(format);
  }

  function formatLabelDateTime(value: string) {
    let format = 'YYYY MM DD';

    switch (interval) {
      case 'hour':
        format = 'HH:mm';
        break;
      case 'day':
        format = 'DD MMMM';
        break;
      case 'month':
      case 'year':
        format = 'MMMM YYYY';
        break;
    }

    return dayjs(value).format(format);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          stroke={theme.color.neutral[theme.darkMode ? '200' : '400']}
          strokeWidth={0.5}
        />

        <XAxis
          dataKey="date"
          orientation="top"
          tickLine={false}
          axisLine={false}
          tickMargin={16}
          tickFormatter={value => formatLabelDateTime(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          padding={{ top: 32 }}
          dx={-24}
          tickFormatter={value =>
            new Intl.NumberFormat(undefined, {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }
        />

        <ChartTooltip
          cursor={{
            strokeWidth: 1,
            strokeOpacity: 1,
          }}
          content={
            <ChartTooltipContent
              labelFormatter={value => formatTooltipDateTime(value)}
              formatter={value => [
                new Intl.NumberFormat(undefined, {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value),
                chartConfig.visitors.label,
              ]}
            />
          }
          contentStyle={{
            backgroundColor: theme.color.background,
            border: 'none',
            borderRadius: 8,
          }}
        />

        <defs>
          <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.color.primary['900']} stopOpacity={0.8} />
            <stop offset="95%" stopColor={theme.color.primary['900']} stopOpacity={0} />
          </linearGradient>
        </defs>

        <Area
          dataKey="visitors"
          type="monotone"
          fill="url(#visitors)"
          fillOpacity={0.4}
          stroke={theme.color.primary['900']}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default translate()(AnalyticsChart);
