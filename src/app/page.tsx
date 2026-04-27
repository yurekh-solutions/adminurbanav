'use client';
import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, DollarSign,
  MessageSquare, CheckCircle2, Clock, AlertCircle, ArrowRight, Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import {
  adminApi,
  type OverviewStats,
  type RevenueTrendPoint,
  type ActivityItem,
  type AdminOrder,
  type KpiStats,
  type InquiryListResponse,
} from '@/lib/api';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'brand' | 'error'> = {
  confirmed: 'info',
  pending: 'warning',
  delivered: 'success',
  completed: 'brand',
  cancelled: 'error',
  preparing: 'info',
};

function fmtPct(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '0%';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [kpis, setKpis] = useState<KpiStats | null>(null);
  const [inquiries, setInquiries] = useState<InquiryListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [ov, tr, act, orders, kp, inq] = await Promise.all([
          adminApi.overview(),
          adminApi.revenueTrend(6),
          adminApi.activity(8),
          adminApi.orders({ page: 1, pageSize: 5 }),
          adminApi.kpis(),
          adminApi.inquiries({ page: 1, pageSize: 1, status: 'open' }),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setTrend(tr);
        setActivity(act);
        setRecentOrders(orders.data);
        setKpis(kp);
        setInquiries(inq);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load dashboard');
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
        <Loader2 className="animate-spin mr-2" size={18} /> Loading dashboard…
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-sm text-red-500">
            Failed to load dashboard: {err}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(overview?.totalRevenue ?? 0),
      change: fmtPct(overview?.deltas.revenuePct),
      up: (overview?.deltas.revenuePct ?? 0) >= 0,
      Icon: DollarSign,
      gradient: 'var(--gradient-primary)',
      glow: 'var(--shadow-neon)',
    },
    {
      label: 'Active Orders',
      value: String(overview?.activeOrders ?? 0),
      change: '',
      up: true,
      Icon: ShoppingCart,
    },
    {
      label: 'Total Users',
      value: String(overview?.totalUsers ?? 0),
      change: fmtPct(overview?.deltas.usersPct),
      up: (overview?.deltas.usersPct ?? 0) >= 0,
      Icon: Users,
    },
    {
      label: 'Equipment Listed',
      value: String(overview?.equipmentCount ?? 0),
      change: fmtPct(overview?.deltas.equipmentPct),
      up: (overview?.deltas.equipmentPct ?? 0) >= 0,
      Icon: Package,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Admin · UrbanAV Marketplace</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RevenueChart data={trend} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <QuickStat
                icon={<DollarSign size={16} />}
                label="Avg. Order Value"
                value={formatCurrency(kpis?.avgOrderValue ?? 0)}
              />
              <QuickStat
                icon={<MessageSquare size={16} />}
                label="Open Inquiries"
                value={String(inquiries?.total ?? 0)}
              />
              <QuickStat
                icon={<CheckCircle2 size={16} />}
                label="Repeat Buyers"
                value={`${(kpis?.repeatBuyerRate ?? 0).toFixed(1)}%`}
              />
              <QuickStat
                icon={<Clock size={16} />}
                label="Active Orders"
                value={String(overview?.activeOrders ?? 0)}
              />
              <QuickStat
                icon={<AlertCircle size={16} />}
                label="Cancellation"
                value={`${(kpis?.cancellationRate ?? 0).toFixed(1)}%`}
              />
            </CardContent>
          </Card>
          <ActivityFeed items={activity} />
        </div>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <a href="/orders" className="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-80">
              View all <ArrowRight size={14} />
            </a>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                <th className="text-left px-6 py-3 font-semibold">Customer</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Supplier</th>
                <th className="text-left px-6 py-3 font-semibold">Amount</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="transition-colors cursor-pointer">
                    <td className="px-6 py-3.5 text-sm font-mono text-primary font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.buyer?.name ?? 'Guest'} size={28} />
                        <span className="text-sm font-medium text-foreground">
                          {order.buyer?.name ?? 'Guest'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground hidden md:table-cell">
                      {order.supplier?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge tone={STATUS_TONE[order.status] ?? 'muted'}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                      {formatDate(order.createdAt)}
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

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, change, up, Icon, gradient, glow,
}: {
  label: string; value: string; change: string; up: boolean;
  Icon: React.ElementType; gradient?: string; glow?: string;
}) {
  if (gradient) {
    return (
      <div
        className="rounded-[var(--radius)] p-5 flex flex-col gap-3 text-white"
        style={{ background: gradient, boxShadow: glow }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/80">{label}</span>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon size={18} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className="text-xs mt-1 flex items-center gap-1 text-white/80">
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change} vs last month
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary">
            <Icon size={18} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change} vs last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick stat row ────────────────────────────────────────────────────────
function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
