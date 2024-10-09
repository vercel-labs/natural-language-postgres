"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { generateChart } from "@/app/actions";
import { Config, Data, Unicorn } from "@/lib/types";

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Data | null;
  chartConfig: Config;
}) {
  const renderChart = () => {
    if (!chartData || !chartConfig) return <div>No chart data</div>;

    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key) => (
              <Bar key={key} dataKey={key} />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartConfig.colors[key]}
                fill={chartConfig.colors[key]}
              />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={chartConfig.yKeys[0]}
              nameKey={chartConfig.xKey}
              cx="50%"
              cy="50%"
              outerRadius={150}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartConfig.colors[entry[chartConfig.xKey]]}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <div className="w-full">
      {!chartData ? (
        <div className="flex items-center justify-center h-[400px] w-full animate-pulse bg-neutral-100"></div>
      ) : null}
      {chartConfig && chartData && (
        <ChartContainer
          config={chartConfig.yKeys.reduce(
            (acc, key) => {
              acc[key] = { label: key, color: chartConfig.colors[key] };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
