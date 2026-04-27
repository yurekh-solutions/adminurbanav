'use client';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import OrderTrendChart from '@/components/dashboard/OrderTrendChart';
import CategoryDonut from '@/components/dashboard/CategoryDonut';
import { formatCurrency } from '@/lib/utils';
import {
  adminApi,
  type KpiStats,
  type RevenueTrendPoint,
  type CategoryStat,
  type TopSupplier,
  type OverviewStats,
} from '@/lib/api';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KpiStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [suppliers, setSuppliers] = useState<TopSupplier[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [kp, ov, tr, cat, top] = await Promise.all([
          adminApi.kpis(),
          adminApi.overview(),
          adminApi.revenueTrend(6),
          adminApi.categories(),
          adminApi.topSuppliers(5),
        ]);
        if (cancelled) return;
        setKpis(kp);
        setOverview(ov);
        setTrend(tr);
        setCategories(cat);
        setSuppliers(top);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading analytics…
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-6 text-sm text-red-500">Failed to load analytics: {err}</CardContent></Card>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Avg. Order Value',
      value: formatCurrency(kpis?.avgOrderValue ?? 0),
      change: '',
      up: true,
    },
    {
      label: 'Repeat Buyers',
      value: `${(kpis?.repeatBuyerRate ?? 0).toFixed(1)}%`,
      change: '',
      up: true,
    },
    {
      label: 'Cancellation Rate',
      value: `${(kpis?.cancellationRate ?? 0).toFixed(1)}%`,
      change: '',
      up: (kpis?.cancellationRate ?? 0) < 10,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(overview?.totalRevenue ?? 0),
      change: `${(overview?.deltas.revenuePct ?? 0) >= 0 ? '+' : ''}${(overview?.deltas.revenuePct ?? 0).toFixed(1)}%`,
      up: (overview?.deltas.revenuePct ?? 0) >= 0,
    },
  ];

  const donutData = categories.map((c) => ({ name: c.category, value: c.revenue }));
  const orderTrendData = trend.map((t) => ({ month: t.month, orders: t.orders }));

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">UrbanAV Marketplace — Performance Overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {k.label}
              </p>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              {k.change && (
                <p className={`text-xs mt-1 font-medium ${k.up ? 'text-green-600' : 'text-red-500'}`}>
                  {k.change} vs last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Order Volume — Last 6 Months</CardTitle></CardHeader>
            <CardContent className="pt-0"><OrderTrendChart data={orderTrendData} /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
          <CardContent className="pt-0"><CategoryDonut data={donutData} /></CardContent>
        </Card>
      </div>

      {/* Top suppliers */}
      <Card>
        <CardHeader><CardTitle>Top Suppliers by Revenue</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">#</th>
                <th className="text-left px-6 py-3 font-semibold">Supplier</th>
                <th className="text-left px-6 py-3 font-semibold">Orders</th>
                <th className="text-left px-6 py-3 font-semibold">Revenue</th>
                <th className="text-left px-6 py-3 font-semibold">Avg Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No supplier revenue data yet
                  </td>
                </tr>
              ) : (
                suppliers.map((s, i) => (
                  <tr key={s.supplierId} className="transition-colors">
                    <td className="px-6 py-3.5 text-sm font-bold text-muted-foreground">#{i + 1}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">{s.supplierName}</td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{s.orders}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                      {formatCurrency(s.revenue)}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-amber-600 font-semibold">
                      ★ {(s.rating ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
