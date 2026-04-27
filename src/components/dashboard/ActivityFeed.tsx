'use client';
import React from 'react';
import { Card, CardTitle, CardContent } from '@/components/ui';
import { Package, Users, ShoppingCart, CheckCircle2, XCircle, Activity } from 'lucide-react';
import type { ActivityItem, ActivityKind } from '@/lib/api';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function resolveIcon(kind: ActivityKind, title: string) {
  const lower = (title || '').toLowerCase();
  if (kind === 'user') return { Icon: Users, color: 'text-green-600' };
  if (kind === 'equipment') return { Icon: Package, color: 'text-blue-600' };
  if (lower.includes('cancel')) return { Icon: XCircle, color: 'text-red-500' };
  if (lower.includes('deliver') || lower.includes('complete'))
    return { Icon: CheckCircle2, color: 'text-green-600' };
  return { Icon: ShoppingCart, color: 'text-primary' };
}

export default function ActivityFeed({ items = [] }: { items?: ActivityItem[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <CardTitle className="mb-3 text-sm">Live Activity</CardTitle>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <Activity size={18} />
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => {
              const { Icon, color } = resolveIcon(a.kind, a.title);
              return (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 ${color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {relativeTime(a.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
