'use client';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface CategoryPoint {
  name: string;
  value: number;
}

const PALETTE = [
  'hsl(280 75% 55%)',
  'hsl(295 90% 65%)',
  'hsl(265 70% 45%)',
  'hsl(240 70% 60%)',
  'hsl(200 75% 55%)',
  'hsl(330 70% 60%)',
  'hsl(160 65% 45%)',
  'hsl(280 20% 70%)',
];

export default function CategoryDonut({ data = [] }: { data?: CategoryPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
        No category data yet
      </div>
    );
  }
  // Convert to percentage shares
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const chartData = data.map((d, i) => ({
    name: d.name,
    value: Math.round((d.value / total) * 100),
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={82}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}%`, 'Share']}
          contentStyle={{
            background: 'hsl(0 0% 100% / 0.95)',
            border: '1px solid hsl(280 25% 88%)',
            borderRadius: '0.75rem',
            fontSize: 12,
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
