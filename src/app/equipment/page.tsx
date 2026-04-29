'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Eye, Star, Power, PowerOff, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { adminApi, type AdminEquipment, type EquipmentListResponse } from '@/lib/api';

const STATUS_TONE = { active: 'success', inactive: 'error', pending: 'warning' } as const;

type StatusFilter = AdminEquipment['status'] | 'all';

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [data, setData] = useState<EquipmentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [featuredMutatingId, setFeaturedMutatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminApi.equipment({
        search: search || undefined,
        category: catFilter !== 'All' ? catFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageSize: 50,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleFeatured = async (eq: AdminEquipment) => {
    setFeaturedMutatingId(eq._id);
    try {
      await adminApi.setEquipmentFeatured(eq._id, !(eq as any).isFeatured);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setFeaturedMutatingId(null);
    }
  };

  const toggleAvailability = async (eq: AdminEquipment) => {
    setMutatingId(eq._id);
    try {
      await adminApi.setEquipmentAvailability(eq._id, !eq.availability);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setMutatingId(null);
    }
  };

  const items = data?.data ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => e.category && set.add(e.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} items across {Math.max(0, categories.length - 1)} categories
          </p>
        </div>
        <Button leftIcon={<Plus size={15} />}>Add Equipment</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
              catFilter === cat
                ? 'bg-primary text-primary-foreground border-primary shadow-[var(--shadow-neon)]'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name or supplier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-10 px-3 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">Equipment</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Category</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Supplier</th>
                <th className="text-left px-6 py-3 font-semibold">Price/Day</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Rating</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Featured</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading equipment…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-red-500">{err}</td>
                </tr>
              )}
              {!loading && !err && items.map((eq) => (
                <tr key={eq._id} className="transition-colors">
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{eq.name}</p>
                      <p className="text-xs text-muted-foreground">{eq.totalBookings} bookings</p>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden md:table-cell">
                    {eq.category}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {eq.supplier?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                    {eq.pricePerDay ? formatCurrency(eq.pricePerDay) : (
                      <span className="text-muted-foreground text-xs">Contact</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    {eq.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-foreground">
                          {eq.rating.toFixed(1)}
                        </span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={STATUS_TONE[eq.status]}>
                      {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <button
                      title={(eq as any).isFeatured ? 'Unfeature' : 'Feature'}
                      disabled={featuredMutatingId === eq._id}
                      onClick={() => toggleFeatured(eq)}
                      className={`p-1.5 rounded-lg transition-colors ${(eq as any).isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-muted-foreground hover:bg-secondary hover:text-amber-500'}`}
                    >
                      {featuredMutatingId === eq._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Star size={14} className={(eq as any).isFeatured ? 'fill-amber-500' : ''} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button
                        title={eq.availability ? 'Disable' : 'Enable'}
                        disabled={mutatingId === eq._id}
                        onClick={() => toggleAvailability(eq)}
                        className={`p-1.5 rounded-lg transition-colors text-muted-foreground disabled:opacity-50 ${eq.availability ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                      >
                        {mutatingId === eq._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : eq.availability ? (
                          <PowerOff size={14} />
                        ) : (
                          <Power size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No equipment matches your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {items.length} of {data?.total ?? 0} items
        </div>
      </Card>
    </div>
  );
}
