'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface OrderPoint {
  month: string;
  orders: number;
}

export default function OrderTrendChart({ data = [] }: { data?: OrderPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
        No order data yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 88%)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(270 15% 50%)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(270 15% 50%)' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(0 0% 100% / 0.95)',
            border: '1px solid hsl(280 25% 88%)',
            borderRadius: '0.75rem',
            fontSize: 12,
          }}
        />
        <Bar dataKey="orders" fill="hsl(280 75% 55%)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
