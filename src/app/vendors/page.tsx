'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, CheckCircle, XCircle, Ban, RotateCcw, Star, AlertTriangle,
  DollarSign, Loader2, X, Eye, TrendingUp, Building2, MapPin, Hash,
  FileText, ExternalLink,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { adminApi, type VendorDetail, type VendorListResponse } from '@/lib/api';

type Tab = 'all' | 'pending' | 'approved' | 'suspended' | 'flagged';

// ── KYC document preview block ─────────────────────────────────
function KycDocumentBlock({ doc }: { doc?: VendorDetail['kycDocument'] | null }) {
  if (!doc || !doc.url) {
    return (
      <div className="p-3 rounded-xl border border-dashed border-muted-foreground/30 bg-secondary/30">
        <p className="text-xs text-muted-foreground">No KYC document on file.</p>
      </div>
    );
  }
  const formatBytes = (b: number) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };
  return (
    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
        <FileText size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">KYC Document</p>
        <p className="text-sm font-semibold text-foreground truncate">{doc.filename || 'Uploaded document'}</p>
        <p className="text-xs text-muted-foreground">
          {(doc.mimeType || 'application/pdf')}
          {doc.size ? `  ·  ${formatBytes(doc.size)}` : ''}
        </p>
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
      >
        <ExternalLink size={14} />
        Open
      </a>
    </div>
  );
}

// ── One document slot row used inside the multi-doc list ──────────────────
function DocSlotRow({
  label,
  requirement,
  doc,
  onViewPdf,
}: {
  label: string;
  requirement: 'required' | 'optional' | 'recommended';
  doc?: VendorDetail['kycDocument'] | null;
  onViewPdf?: (url: string) => void;
}) {
  const formatBytes = (b: number) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };
  const badgeCls =
    requirement === 'required'
      ? 'bg-red-100 text-red-700 border-red-200'
      : requirement === 'optional'
      ? 'bg-secondary text-muted-foreground border-border'
      : 'bg-green-100 text-green-700 border-green-200';
  const has = !!(doc && doc.url);
  return (
    <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${has ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeCls}`}>
            {requirement}
          </span>
        </div>
        {has ? (
          <>
            <p className="text-xs text-foreground/80 truncate">{doc!.filename || 'Uploaded document'}</p>
            <p className="text-[11px] text-muted-foreground">
              {(doc!.mimeType || 'application/pdf')}
              {doc!.size ? `  ·  ${formatBytes(doc!.size)}` : ''}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">No file uploaded.</p>
        )}
      </div>
      {has && (
        <button
          onClick={() => onViewPdf?.(doc!.url)}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <ExternalLink size={13} />
          View PDF
        </button>
      )}
    </div>
  );
}

// ── Full KYC section: 4 slots shown together ──────────────────────────
function VendorKycSection({ vendor, onViewPdf }: { vendor: VendorDetail; onViewPdf?: (url: string) => void }) {
  const docs = vendor.kycDocuments || {};
  const panDoc = docs.pan && docs.pan.url ? docs.pan : vendor.kycDocument || null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">KYC Documents</p>
      <DocSlotRow label="PAN Card" requirement="required" doc={panDoc} onViewPdf={onViewPdf} />
      <DocSlotRow label="Aadhaar Card" requirement="optional" doc={docs.aadhaar} onViewPdf={onViewPdf} />
      <DocSlotRow label="Bank Proof" requirement="required" doc={docs.bankProof} onViewPdf={onViewPdf} />
      <DocSlotRow label="GST / Business License" requirement="recommended" doc={docs.gst} onViewPdf={onViewPdf} />
    </div>
  );
}

const KYC_TONE: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
};
const STATUS_TONE: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  active: 'success',
  suspended: 'error',
  pending: 'warning',
  rejected: 'error',
};

function maskCode(val: string): string {
  if (!val || val.length < 6) return val || '—';
  return val.slice(0, 2) + '****' + val.slice(-4);
}

function StatusBadge({ value, toneMap, label }: { value: string; toneMap: Record<string, any>; label?: string }) {
  return (
    <Badge tone={toneMap[value] || 'info'}>
      {label || value.charAt(0).toUpperCase() + value.slice(1)}
    </Badge>
  );
}

interface ModalState {
  type: 'approve' | 'reject' | 'suspend' | 'commission' | 'fraud' | 'view' | null;
  vendor: VendorDetail | null;
  value?: string;
}

export default function VendorsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<VendorListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null, vendor: null });
  const [modalInput, setModalInput] = useState('');
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  const tabCounts = data ? {
    all: data.total,
    pending: data.vendors.filter(v => v.kycStatus !== 'approved' && v.accountStatus !== 'rejected' && v.accountStatus !== 'suspended').length,
    approved: data.vendors.filter(v => v.accountStatus === 'active' && v.kycStatus === 'approved').length,
    suspended: data.vendors.filter(v => v.accountStatus === 'suspended').length,
    flagged: data.vendors.filter(v => v.isFraudFlagged).length,
  } : { all: 0, pending: 0, approved: 0, suspended: 0, flagged: 0 };

  const tabFilter: Record<Tab, string | undefined> = {
    all: undefined,
    pending: 'pending',
    approved: 'active',
    suspended: 'suspended',
    flagged: undefined,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      let params: Record<string, string> = { pageSize: '50' };
      if (search) params.search = search;
      if (tab === 'flagged') params.featured = 'false';
      else if (tab !== 'all') {
        if (tab === 'pending') {
          params.kycStatus = 'pending,submitted';
          params.accountStatus = 'pending';
        } else if (tab === 'approved') {
          params.kycStatus = 'approved';
          params.accountStatus = 'active';
        } else if (tab === 'suspended') {
          params.accountStatus = 'suspended';
        }
      }
      const res = await adminApi.vendors(params);
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [search, tab]);

  useEffect(() => { load(); }, [load]);

  const vendors = tab === 'flagged'
    ? (data?.vendors.filter(v => v.isFraudFlagged) ?? [])
    : data?.vendors ?? [];

  const action = async (fn: () => Promise<any>) => {
    setMutatingId(modal.vendor?.id ?? null);
    try {
      await fn();
      setModal({ type: null, vendor: null });
      setModalInput('');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setMutatingId(null);
    }
  };

  const handleToggleFeatured = async (v: VendorDetail) => {
    setMutatingId(v.id);
    try {
      await adminApi.toggleVendorFeatured(v.id, !v.isFeatured);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setMutatingId(null);
    }
  };

  const renderModal = () => {
    if (!modal.vendor) return null;
    const { type, vendor } = modal;

    const titleMap: Record<string, string> = {
      approve: 'Approve Vendor',
      reject: 'Reject Vendor',
      suspend: 'Suspend Vendor',
      commission: 'Update Commission',
      fraud: 'Flag as Fraud',
      view: 'Vendor Details',
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <Card className="w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{titleMap[type!]}</h2>
            <button onClick={() => { setModal({ type: null, vendor: null }); setModalInput(''); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Vendor info header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {vendor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{vendor.name}</p>
              <p className="text-xs text-muted-foreground">{vendor.businessName}</p>
            </div>
          </div>

          {type === 'view' && (
            <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-foreground break-all">{vendor.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-foreground">{vendor.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">GST Number</p>
                  <p className="text-foreground">{maskCode(vendor.gstNumber)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">PAN Number</p>
                  <p className="text-foreground">{maskCode(vendor.panNumber)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Years in Business</p>
                  <p className="text-foreground">{vendor.yearsInBusiness ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Commission</p>
                  <p className="text-foreground">{vendor.commissionRate}%</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Service Area</p>
                  <p className="text-foreground">{vendor.serviceArea?.city || '—'}, {vendor.serviceArea?.state || '—'}</p>
                </div>
              </div>

              {vendor.businessDescription && (
                <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Business Description</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{vendor.businessDescription}</p>
                </div>
              )}

              {vendor.productsOffered && vendor.productsOffered.length > 0 && (
                <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Products / Services Offered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.productsOffered.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {vendor.kycRejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-semibold">Rejection Reason</p>
                  <p className="text-sm text-red-700 mt-1">{vendor.kycRejectionReason}</p>
                </div>
              )}

              <VendorKycSection vendor={vendor} onViewPdf={setPdfPreview} />

              {vendor.fraudNotes && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-semibold">Fraud Notes</p>
                  <p className="text-sm text-red-700 mt-1">{vendor.fraudNotes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="destructive" size="sm"
                  onClick={() => action(async () => { await adminApi.suspendVendor(vendor.id); })}
                >Suspend</Button>
                <Button className="flex-1" size="sm"
                  onClick={() => action(async () => { await adminApi.approveVendor(vendor.id); })}
                >Approve</Button>
              </div>
            </div>
          )}

          {(type === 'reject' || type === 'suspend' || type === 'fraud') && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {type === 'reject' && 'Provide a reason for rejection. The vendor will be notified.'}
                {type === 'suspend' && 'Add notes about why this vendor is being suspended.'}
                {type === 'fraud' && 'Describe the fraudulent activity or concern.'}
              </p>
              {type === 'reject' && <VendorKycSection vendor={vendor} onViewPdf={setPdfPreview} />}
              <textarea
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                placeholder={type === 'reject' ? 'Rejection reason…' : type === 'suspend' ? 'Suspension notes…' : 'Fraud notes…'}
                className="w-full h-24 px-3 py-2 text-sm bg-card border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                suppressHydrationWarning
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setModal({ type: null, vendor: null })}>Cancel</Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  loading={!!mutatingId}
                  onClick={() => {
                    if (type === 'reject') action(async () => { await adminApi.rejectVendor(vendor.id, modalInput); });
                    if (type === 'suspend') action(async () => { await adminApi.suspendVendor(vendor.id); });
                    if (type === 'fraud') action(async () => { await adminApi.flagVendorFraud(vendor.id, modalInput); });
                  }}
                >
                  {type === 'reject' ? 'Reject' : type === 'suspend' ? 'Suspend' : 'Flag Fraud'}
                </Button>
              </div>
            </div>
          )}

          {type === 'commission' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Set the commission rate (0–100%). Current: {vendor.commissionRate}%</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  placeholder={String(vendor.commissionRate)}
                  className="flex-1 h-10 px-3 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  suppressHydrationWarning
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setModal({ type: null, vendor: null })}>Cancel</Button>
                <Button className="flex-1" loading={!!mutatingId}
                  onClick={() => action(async () => { await adminApi.updateVendorCommission(vendor.id, Number(modalInput)); })}>
                  Update
                </Button>
              </div>
            </div>
          )}

          {type === 'approve' && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <p className="text-sm text-muted-foreground">
                Approve <strong>{vendor.name}</strong> ({vendor.businessName})? They will be able to log in and manage their equipment.
              </p>
              <VendorKycSection vendor={vendor} onViewPdf={setPdfPreview} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setModal({ type: null, vendor: null })}>Cancel</Button>
                <Button className="flex-1" loading={!!mutatingId}
                  onClick={() => action(async () => { await adminApi.approveVendor(vendor.id); })}>
                  Approve
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // PDF Preview Modal
  const renderPdfPreview = () => {
    if (!pdfPreview) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl h-[90vh] bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Document Preview</h3>
            <button
              onClick={() => setPdfPreview(null)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 bg-white">
            <iframe
              src={pdfPreview}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <a
              href={pdfPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={16} />
              Open in New Tab
            </a>
            <button
              onClick={() => setPdfPreview(null)}
              className="h-10 px-6 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} suppliers registered</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'all', label: 'All', icon: Building2 },
          { key: 'pending', label: 'Pending', icon: Clock },
          { key: 'approved', label: 'Approved', icon: CheckCircle },
          { key: 'suspended', label: 'Suspended', icon: Ban },
          { key: 'flagged', label: 'Flagged', icon: AlertTriangle },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              tab === key
                ? 'bg-primary text-primary-foreground shadow-[var(--shadow-neon)]'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <Icon size={14} />
            {label}
            {tabCounts[key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-muted'}`}>
                {tabCounts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name, email, or business…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-secondary/50 border border-border rounded-[0.75rem] focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">GST / PAN</th>
                <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Service Area</th>
                <th className="text-left px-6 py-3 font-semibold">KYC</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Commission</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="animate-spin inline mr-2" size={14} /> Loading vendors…
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-red-500">{err}</td></tr>
              )}
              {!loading && !err && vendors.map(v => (
                <tr key={v.id} className={`transition-colors ${v.isFraudFlagged ? 'bg-red-50/40' : ''}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                        {v.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {v.name}
                          {v.isFraudFlagged && <AlertTriangle size={13} className="text-red-500" />}
                          {v.isFeatured && <Star size={13} className="text-amber-500 fill-amber-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{v.businessName || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 hidden md:table-cell">
                    <div className="space-y-0.5 text-xs">
                      <span className="text-muted-foreground">GST: </span>
                      <span className="text-foreground">{maskCode(v.gstNumber)}</span>
                      <br />
                      <span className="text-muted-foreground">PAN: </span>
                      <span className="text-foreground">{maskCode(v.panNumber)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 hidden lg:table-cell text-sm text-muted-foreground">
                    {v.serviceArea?.city ? `${v.serviceArea.city}, ${v.serviceArea.state || '—'}` : '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge value={v.kycStatus} toneMap={KYC_TONE} label={v.kycStatus} />
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge value={v.accountStatus} toneMap={STATUS_TONE} />
                  </td>
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{v.commissionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button onClick={() => setModal({ type: 'view', vendor: v })} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      {v.accountStatus !== 'active' && v.kycStatus !== 'rejected' && (
                        <button
                          disabled={mutatingId === v.id}
                          onClick={() => action(async () => { await adminApi.approveVendor(v.id); })}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {mutatingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </button>
                      )}
                      {v.kycStatus === 'submitted' && (
                        <button
                          disabled={mutatingId === v.id}
                          onClick={() => setModal({ type: 'approve', vendor: v })}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {(v.kycStatus === 'pending' || v.kycStatus === 'submitted') && (
                        <button
                          disabled={mutatingId === v.id}
                          onClick={() => setModal({ type: 'reject', vendor: v })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {v.accountStatus === 'active' && (
                        <button
                          disabled={mutatingId === v.id}
                          onClick={() => setModal({ type: 'suspend', vendor: v })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Suspend"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                      {v.accountStatus === 'suspended' && (
                        <button
                          disabled={mutatingId === v.id}
                          onClick={() => action(async () => { await adminApi.reactivateVendor(v.id); })}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
                          title="Reactivate"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button
                        disabled={mutatingId === v.id}
                        onClick={() => setModal({ type: 'commission', vendor: v })}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Set Commission"
                      >
                        <DollarSign size={14} />
                      </button>
                      <button
                        disabled={mutatingId === v.id}
                        onClick={() => handleToggleFeatured(v)}
                        className={`p-1.5 rounded-lg transition-colors ${v.isFeatured ? 'hover:bg-amber-50 text-amber-500 hover:text-amber-600' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
                        title={v.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        {mutatingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} className={v.isFeatured ? 'fill-amber-500' : ''} />}
                      </button>
                      <button
                        disabled={mutatingId === v.id}
                        onClick={() => v.isFraudFlagged
                          ? action(async () => { await adminApi.unflagVendorFraud(v.id); })
                          : setModal({ type: 'fraud', vendor: v })}
                        className={`p-1.5 rounded-lg transition-colors ${v.isFraudFlagged ? 'hover:bg-green-50 text-red-500' : 'hover:bg-red-50 text-muted-foreground hover:text-red-500'}`}
                        title={v.isFraudFlagged ? 'Unflag' : 'Flag Fraud'}
                      >
                        <AlertTriangle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !err && vendors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No vendors in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground">
          Showing {vendors.length} of {data?.total ?? 0} vendors
        </div>
      </Card>

      {modal.type && renderModal()}
    </div>
  );
}

// Need Clock for pending tab
function Clock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}