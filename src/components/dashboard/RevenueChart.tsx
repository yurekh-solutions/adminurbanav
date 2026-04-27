'use client';
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export interface RevenuePoint {
  month: string;
  revenue: number;
  orders?: number;
}

function formatK(v: number) {
  return v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;
}

export default function RevenueChart({ data = [] }: { data?: RevenuePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
        No revenue data yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="hsl(280 75% 55%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(280 75% 55%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 88%)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(270 15% 50%)' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: 'hsl(270 15% 50%)' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
          contentStyle={{
            background: 'hsl(0 0% 100% / 0.95)',
            border: '1px solid hsl(280 25% 88%)',
            borderRadius: '0.75rem',
            fontSize: 12,
            boxShadow: '0 8px 24px -6px hsl(280 40% 60% / 0.25)',
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(280 75% 55%)"
          strokeWidth={2.5}
          fill="url(#revGrad)"
          dot={{ r: 4, fill: 'hsl(280 75% 55%)', stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
