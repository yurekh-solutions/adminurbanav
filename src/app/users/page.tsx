'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, UserPlus, MoreVertical, ShieldCheck, ShieldOff, Eye, Loader2,
} from 'lucide-react';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { adminApi, type AdminUser, type UserListResponse } from '@/lib/api';

const ROLE_TONE = { buyer: 'info', supplier: 'brand', admin: 'warning' } as const;
const STATUS_TONE = { active: 'success', suspended: 'error', pending: 'warning' } as const;

type RoleFilter = AdminUser['userType'] | 'all';
type StatusFilter = AdminUser['accountStatus'] | 'all';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminApi.users({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageSize: 50,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleStatus = async (u: AdminUser) => {
    const next: AdminUser['accountStatus'] = u.accountStatus === 'active' ? 'suspended' : 'active';
    setMutatingId(u._id);
    try {
      await adminApi.setUserStatus(u._id, next);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setMutatingId(null);
    }
  };

  const users = data?.data ?? [];
  const summary = data?.summary ?? { total: 0, buyers: 0, suppliers: 0, suspended: 0 };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.total} total users registered
          </p>
        </div>
        <Button leftIcon={<UserPlus size={15} />}>Invite User</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',     count: summary.total,     color: 'bg-secondary' },
          { label: 'Buyers',    count: summary.buyers,    color: 'bg-blue-50 text-blue-700 border border-blue-200' },
          { label: 'Suppliers', count: summary.suppliers, color: 'bg-purple-50 text-purple-700 border border-purple-200' },
          { label: 'Suspended', count: summary.suspended, color: 'bg-red-50 text-red-700 border border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-[var(--radius)] p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="h-10 px-3 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="supplier">Supplier</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 px-3 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">User</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Phone</th>
                <th className="text-left px-6 py-3 font-semibold">Role</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Joined</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Verified</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading users…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-red-500">{err}</td>
                </tr>
              )}
              {!loading && !err && users.map((user) => (
                <tr key={user._id} className="transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size={34} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden md:table-cell">
                    {user.phone || '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={ROLE_TONE[user.userType] ?? 'muted'}>
                      {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge tone={STATUS_TONE[user.accountStatus] ?? 'muted'}>
                      {user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-3.5 text-sm hidden sm:table-cell">
                    {user.isVerified ? (
                      <span className="text-green-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button title="View" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={14} />
                      </button>
                      <button
                        title={user.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                        disabled={mutatingId === user._id}
                        onClick={() => toggleStatus(user)}
                        className={`p-1.5 rounded-lg transition-colors ${user.accountStatus === 'active' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'} text-muted-foreground disabled:opacity-50`}
                      >
                        {mutatingId === user._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : user.accountStatus === 'active' ? (
                          <ShieldOff size={14} />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                      </button>
                      <button title="More" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {users.length} of {summary.total} users
        </div>
      </Card>
    </div>
  );
}
