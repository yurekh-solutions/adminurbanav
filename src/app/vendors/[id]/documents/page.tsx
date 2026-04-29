'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, ExternalLink, Download, Eye, Calendar, HardDrive } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { adminApi, type VendorDetail } from '@/lib/api';

type DocSlot = {
  key: string;
  label: string;
  requirement: 'required' | 'optional' | 'recommended';
  doc?: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt?: string;
  } | null;
};

export default function VendorDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  const loadVendor = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminApi.getVendor(vendorId);
      setVendor(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const documents: DocSlot[] = vendor
    ? [
        {
          key: 'pan',
          label: 'PAN Card',
          requirement: 'required',
          doc: (vendor.kycDocuments?.pan && vendor.kycDocuments.pan.url)
            ? vendor.kycDocuments.pan
            : vendor.kycDocument || null,
        },
        {
          key: 'aadhaar',
          label: 'Aadhaar Card',
          requirement: 'optional',
          doc: vendor.kycDocuments?.aadhaar || null,
        },
        {
          key: 'bankProof',
          label: 'Bank Proof',
          requirement: 'required',
          doc: vendor.kycDocuments?.bankProof || null,
        },
        {
          key: 'gst',
          label: 'GST / Business License',
          requirement: 'recommended',
          doc: vendor.kycDocuments?.gst || null,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (err || !vendor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Documents</h2>
          <p className="text-muted-foreground mb-4">{err || 'Vendor not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">KYC Documents</h1>
                <p className="text-sm text-muted-foreground">
                  {vendor.name} · {vendor.businessName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={vendor.kycStatus === 'approved' ? 'success' : vendor.kycStatus === 'rejected' ? 'error' : 'warning'}>
                KYC: {vendor.kycStatus}
              </Badge>
              <Badge tone={vendor.accountStatus === 'active' ? 'success' : 'warning'}>
                Account: {vendor.accountStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Documents ({documents.filter(d => d.doc?.url).length}/4)</h2>
            
            {documents.map((doc) => {
              const hasFile = !!(doc.doc?.url);
              const isSelected = selectedDoc === doc.key;
              const badgeCls =
                doc.requirement === 'required'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : doc.requirement === 'optional'
                  ? 'bg-secondary text-muted-foreground border-border'
                  : 'bg-green-100 text-green-700 border-green-200';

              return (
                <Card
                  key={doc.key}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                  } ${!hasFile ? 'opacity-60' : ''}`}
                  onClick={() => hasFile && setSelectedDoc(doc.key)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      hasFile ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeCls}`}>
                          {doc.requirement}
                        </span>
                      </div>
                      {hasFile ? (
                        <>
                          <p className="text-xs text-foreground/80 truncate">{doc.doc!.filename}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <HardDrive size={12} />
                              {formatBytes(doc.doc!.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(doc.doc!.uploadedAt)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">No file uploaded</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            {selectedDoc ? (
              <Card className="h-[calc(100vh-200px)] flex flex-col">
                {/* Viewer Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Eye size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {documents.find(d => d.key === selectedDoc)?.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {documents.find(d => d.key === selectedDoc)?.doc?.filename}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={documents.find(d => d.key === selectedDoc)?.doc?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
                    >
                      <ExternalLink size={16} />
                      Open in Tab
                    </a>
                    <a
                      href={documents.find(d => d.key === selectedDoc)?.doc?.url}
                      download
                      className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 bg-white rounded-b-lg overflow-hidden">
                  <iframe
                    src={documents.find(d => d.key === selectedDoc)?.doc?.url}
                    className="w-full h-full border-0"
                    title={`${documents.find(d => d.key === selectedDoc)?.label} Preview`}
                  />
                </div>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <FileText size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Select a Document</h3>
                  <p className="text-muted-foreground max-w-md">
                    Click on any document from the list to preview it here. You can view, download, or open it in a new tab.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
