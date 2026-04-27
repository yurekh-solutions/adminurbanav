'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, MessageSquare, CalendarDays, Loader2 } from 'lucide-react';
import { Card, Badge, Avatar } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { adminApi, type AdminOrder, type OrderListResponse } from '@/lib/api';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'brand' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  delivered: 'success',
  completed: 'brand',
  cancelled: 'error',
};

const STATUS_CHIPS = ['all', 'pending', 'confirmed', 'preparing', 'delivered', 'completed', 'cancelled'] as const;
type StatusChip = typeof STATUS_CHIPS[number];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusChip>('all');
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminApi.orders({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageSize: 50,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const orders = data?.data ?? [];
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} orders · {formatCurrency(totalRevenue)} revenue on this page
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_CHIPS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all capitalize ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary shadow-[var(--shadow-neon)]'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
            }`}
          >
            {s === 'all' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search orders, buyers, supplier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">Order</th>
                <th className="text-left px-6 py-3 font-semibold">Buyer</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Supplier</th>
                <th className="text-left px-6 py-3 font-semibold">Amount</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Payment</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading orders…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-red-500">{err}</td>
                </tr>
              )}
              {!loading && !err && orders.map((order: AdminOrder) => (
                <tr key={order._id} className="transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-mono font-semibold text-primary">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CalendarDays size={11} /> {formatDate(order.createdAt)}
                    </p>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={order.buyer?.name ?? 'Guest'} size={28} />
                      <span className="text-sm font-medium text-foreground">
                        {order.buyer?.name ?? 'Guest'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {order.supplier?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-muted-foreground bg-secondary border border-border'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={STATUS_TONE[order.status] ?? 'muted'}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {orders.length} of {data?.total ?? 0} orders
        </div>
      </Card>
    </div>
  );
}
