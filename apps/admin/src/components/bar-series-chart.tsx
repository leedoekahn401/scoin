'use client';

import { formatCredits, formatNumber } from '@schoolcoin/ui';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/**
 * The admin's one bar chart. Colours come from the Warm Studio tokens via CSS
 * variables (gold for sales, ink for money-in) so charts stay on-palette.
 */
export function BarSeriesChart({
  data,
  tone = 'brand',
  height = 220,
  unit = 'credits',
}: {
  data: { label: string; value: number }[];
  tone?: 'brand' | 'ink';
  height?: number;
  unit?: 'credits' | 'count';
}) {
  const fill = tone === 'brand' ? 'var(--color-brand)' : 'var(--color-ink-fg)';
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-paper-bg)' }}
          contentStyle={{
            borderRadius: 'var(--ui-radius-sm)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--ui-shadow-md)',
            fontSize: 13,
          }}
          formatter={(v) => [
            unit === 'credits' ? formatCredits(Number(v)) : formatNumber(Number(v)),
            '',
          ]}
          separator=""
        />
        <Bar
          dataKey="value"
          fill={fill}
          fillOpacity={tone === 'ink' ? 0.85 : 1}
          radius={[5, 5, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
