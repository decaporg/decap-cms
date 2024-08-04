import React, { forwardRef, useMemo } from 'react';
import * as RechartsPrimitive from 'recharts';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContainer = RechartsPrimitive.ResponsiveContainer;

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = RechartsPrimitive.DefaultTooltipContent;

// const ChartTooltipContent = forwardRef<HTMLDivElement, React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
// React.ComponentProps<"div"> & {
//   hideLabel?: boolean;
//   hideIndicator?: boolean;
//   indicator?: "line" | "dot" | "dashed"
//   nameKey?: string;
//   labelKey?: string;
// }
// >(({ active, payload, className, indicator= "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey}, ref ) => {
//   const { config} = useChart();

//   const tooltipLabel = useMemo(() => {
//     if (hideLabel || !payload?.length) {
//       return null;
//     }

//     if (label) {
//       return label;
//     }

//     if (payload && payload.length) {
//       return payload[0].payload[nameKey || 'name'];
//     }

//     return null;
//   })
// })

// }

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = RechartsPrimitive.DefaultLegendContent;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  // ChartStyle,
};
