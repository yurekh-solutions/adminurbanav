'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Building2, Mail, Phone, Globe, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platformName: 'UrbanAV',
    supportEmail: 'support@urbanav.com',
    supportPhone: '+91 9876543210',
    commissionRate: '5',
    currency: 'INR',
    maxRentalDays: '30',
    autoApproveVendors: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire up backend API
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure platform preferences and system settings</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            icon={<Building2 size={16} />}
            label="Platform Name"
            description="Display name across all user-facing screens"
            input={
              <input
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-48 placeholder:text-muted-foreground/60"
              />
            }
          />
          <SettingRow
            icon={<Mail size={16} />}
            label="Support Email"
            description="Contact email shown to users"
            input={
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-48 placeholder:text-muted-foreground/60"
              />
            }
          />
          <SettingRow
            icon={<Phone size={16} />}
            label="Support Phone"
            description="Phone number for user support"
            input={
              <input
                value={form.supportPhone}
                onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-48 placeholder:text-muted-foreground/60"
              />
            }
          />
          <SettingRow
            icon={<Globe size={16} />}
            label="Currency"
            description="Default currency for all transactions"
            input={
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-48"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            }
          />
        </CardContent>
      </Card>

      {/* Commission & Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Commission & Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Platform Commission"
            description="Percentage fee on every order (charged to buyer)"
            input={
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            }
          />
          <SettingRow
            label="Max Rental Days"
            description="Maximum allowed rental duration per booking"
            input={
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.maxRentalDays}
                  onChange={(e) => setForm({ ...form, maxRentalDays: e.target.value })}
                  className="h-9 px-3 text-sm bg-secondary/70 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            }
          />
          <SettingRow
            label="Auto-Approve Vendors"
            description="Automatically approve new vendor registrations without manual review"
            input={
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoApproveVendors}
                  onChange={(e) => setForm({ ...form, autoApproveVendors: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[var(--shadow-neon)]"
        >
          {saving ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors border border-border"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  description,
  input,
}: {
  icon?: React.ReactNode;
  label: string;
  description: string;
  input: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{input}</div>
    </div>
  );
}