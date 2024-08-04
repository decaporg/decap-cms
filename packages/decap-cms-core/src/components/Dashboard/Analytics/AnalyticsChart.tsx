import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import type { Pageview } from 'decap-cms-lib-analytics';
import { ChartConfig, ChartTooltip, ChartTooltipContent } from 'decap-cms-ui-next';
import { useTheme } from '@emotion/react';
import { translate } from 'react-polyglot';

type Props = {
  data: Pageview[];
};

function AnalyticsChart({ data, t }: Props) {
  const theme = useTheme();

  const chartConfig = {
    pageviews: {
      label: t('dashboard.siteAnalytics.chart.visitors'),
      color: theme.color.primary['900'],
    },
  } satisfies ChartConfig;

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
          minTickGap={16}
          tickFormatter={value =>
            new Date(value).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          }
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
              labelFormatter={value =>
                new Date(value).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={value => [
                new Intl.NumberFormat(undefined, {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value),
                chartConfig.pageviews.label,
              ]}
            />
          }
          contentStyle={{ backgroundColor: theme.color.surface, border: 'none', borderRadius: 8 }}
        />

        <defs>
          <linearGradient id="pageviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.color.primary['900']} stopOpacity={0.8} />
            <stop offset="95%" stopColor={theme.color.primary['900']} stopOpacity={0} />
          </linearGradient>
        </defs>

        <Area
          dataKey="pageviews"
          type="natural"
          fill="url(#pageviews)"
          fillOpacity={0.4}
          stroke={theme.color.primary['900']}
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default translate()(AnalyticsChart);
