'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Briefcase, Store, Tag, Search, ArrowUpRight,
    Package, Calendar, Building2, User, ChevronRight,
    ExternalLink, Layers, CheckCircle2, Clock, XCircle,
    TrendingUp, FileText, ShoppingBag, ArrowRight
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BreakdownType = 'department' | 'vendor' | 'category' | 'month';

interface PurchaseBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: BreakdownType;
    name: string;
    records: PurchaseRecord[];
    onSelectRecord: (record: PurchaseRecord) => void;
    onApplyFilter?: (type: BreakdownType, value: string) => void;
}

interface ParsedItem {
    description: string;
    qty: number;
    price: number;
    total: number;
    parentRecord: PurchaseRecord;
}

export const PurchaseBreakdownModal: React.FC<PurchaseBreakdownModalProps> = ({
    isOpen,
    onClose,
    type,
    name,
    records,
    onSelectRecord,
    onApplyFilter
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'transactions' | 'items'>('transactions');

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Reset search on reopen
    useEffect(() => {
        if (isOpen) setSearchQuery('');
    }, [isOpen, name]);

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    // Format date readable
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Parse all items from all records
    const { allParsedItems, totalAmount, totalUnits } = useMemo(() => {
        const itemsList: ParsedItem[] = [];
        let total = 0;
        let units = 0;

        records.forEach(rec => {
            total += Number(rec.subtotal || 0);

            let rawItems = rec.items;
            if (typeof rawItems === 'string') {
                try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
            }

            if (Array.isArray(rawItems) && rawItems.length > 0) {
                rawItems.forEach((it: any) => {
                    const q = Number(it.qty || it.quantity || 1);
                    const p = Number(it.price || it.unit_price || 0);
                    const t = Number(it.total || (q * p));
                    units += q;
                    itemsList.push({
                        description: it.description || it.name || it.item_name || rec.description || 'Item Pembelian',
                        qty: q,
                        price: p,
                        total: t,
                        parentRecord: rec
                    });
                });
            } else {
                const q = Number(rec.qty || 1);
                const p = Number(rec.price || rec.subtotal || 0);
                const t = Number(rec.subtotal || (q * p));
                units += q;
                itemsList.push({
                    description: rec.description || 'Pembelian Langsung',
                    qty: q,
                    price: p,
                    total: t,
                    parentRecord: rec
                });
            }
        });

        return { allParsedItems: itemsList, totalAmount: total, totalUnits: units };
    }, [records]);

    // Group items by name for "Daftar Barang / Item" summary
    const aggregatedItems = useMemo(() => {
        const map: Record<string, { description: string; totalQty: number; totalCost: number; count: number; sampleRecord: PurchaseRecord }> = {};
        
        allParsedItems.forEach(item => {
            const key = item.description.trim().toLowerCase();
            if (!map[key]) {
                map[key] = {
                    description: item.description.trim(),
                    totalQty: 0,
                    totalCost: 0,
                    count: 0,
                    sampleRecord: item.parentRecord
                };
            }
            map[key].totalQty += item.qty;
            map[key].totalCost += item.total;
            map[key].count += 1;
        });

        return Object.values(map).sort((a, b) => b.totalCost - a.totalCost);
    }, [allParsedItems]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        if (!searchQuery.trim()) return records;
        const q = searchQuery.toLowerCase();
        return records.filter(r => {
            const matchHeader = (r.description || '').toLowerCase().includes(q) ||
                (r.transactionId || '').toLowerCase().includes(q) ||
                (r.vendor || '').toLowerCase().includes(q) ||
                (r.user || '').toLowerCase().includes(q) ||
                (r.company || '').toLowerCase().includes(q);
            
            // Also check items inside
            let rawItems = r.items;
            if (typeof rawItems === 'string') {
                try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
            }
            const matchItem = Array.isArray(rawItems) && rawItems.some((it: any) =>
                (it.description || '').toLowerCase().includes(q)
            );

            return matchHeader || matchItem;
        });
    }, [records, searchQuery]);

    // Filtered aggregated items
    const filteredAggregatedItems = useMemo(() => {
        if (!searchQuery.trim()) return aggregatedItems;
        const q = searchQuery.toLowerCase();
        return aggregatedItems.filter(it => it.description.toLowerCase().includes(q));
    }, [aggregatedItems, searchQuery]);

    if (!isOpen) return null;

    // Type styling meta
    const typeMeta = {
        department: {
            title: 'Alokasi Departemen',
            badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            icon: Briefcase,
            accentBg: 'from-emerald-500/10 to-teal-500/5',
            accentBorder: 'border-emerald-500/30'
        },
        vendor: {
            title: 'Key Supplier / Vendor',
            badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800',
            icon: Store,
            accentBg: 'from-rose-500/10 to-amber-500/5',
            accentBorder: 'border-rose-500/30'
        },
        category: {
            title: 'Kategori Pengeluaran',
            badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            icon: Tag,
            accentBg: 'from-indigo-500/10 to-blue-500/5',
            accentBorder: 'border-indigo-500/30'
        },
        month: {
            title: 'Periode Bulanan',
            badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800',
            icon: Calendar,
            accentBg: 'from-blue-500/10 to-indigo-500/5',
            accentBorder: 'border-blue-500/30'
        }
    }[type];

    const IconComponent = typeMeta.icon;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/80 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 shadow-sm text-slate-800 dark:text-white shrink-0">
                                <IconComponent size={22} className="text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", typeMeta.badgeBg)}>
                                        {typeMeta.title}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                                        • Rincian Pengadaan
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                    {name || 'Tidak Diketahui'}
                                </h2>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">Total Pengeluaran</span>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
                                {formatIDR(totalAmount)}
                            </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">Total Transaksi</span>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                                {records.length} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
                            </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">Total Item Terbeli</span>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                                {totalUnits} <span className="text-xs font-semibold text-slate-400">Unit / Barang</span>
                            </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">Rata-rata Transaksi</span>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
                                {records.length > 0 ? formatIDR(Math.round(totalAmount / records.length)) : 'Rp 0'}
                            </span>
                        </div>
                    </div>

                    {/* Search & Tabs Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5">
                        {/* Tabs */}
                        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-zinc-800 rounded-xl shrink-0">
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                                    activeTab === 'transactions'
                                        ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                                )}
                            >
                                <FileText size={14} />
                                Daftar Transaksi ({records.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('items')}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                                    activeTab === 'items'
                                        ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                                )}
                            >
                                <Package size={14} />
                                Rangkuman Barang ({aggregatedItems.length})
                            </button>
                        </div>

                        {/* Search input */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder={activeTab === 'transactions' ? "Cari nomor transaksi, pemohon, deskripsi..." : "Cari nama barang..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Body Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                    {activeTab === 'transactions' ? (
                        filteredRecords.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Tidak ada transaksi ditemukan</h3>
                                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Coba ubah kata kunci pencarian Anda.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredRecords.map((record) => {
                                    // Parse inner items
                                    let items = record.items;
                                    if (typeof items === 'string') {
                                        try { items = JSON.parse(items); } catch { items = []; }
                                    }
                                    const hasItems = Array.isArray(items) && items.length > 0;

                                    return (
                                        <div
                                            key={record.id || record.transactionId}
                                            className="group/card rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-blue-400/60 dark:hover:border-blue-500/40 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            {/* Transaction Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                                                        {record.transactionId || `TR-${record.id}`}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                                        <Calendar size={13} />
                                                        <span>{formatDate(record.purchaseDate)}</span>
                                                    </div>
                                                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                                                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                                                        <User size={13} className="text-slate-400" />
                                                        <span>{record.user || 'Unknown'}</span>
                                                    </div>
                                                    {record.company && (
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                                            {record.company}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                                    <div className="text-right">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block leading-none">Subtotal</span>
                                                        <span className="text-base font-black font-mono text-slate-900 dark:text-white leading-tight">
                                                            {formatIDR(record.subtotal || 0)}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            onClose();
                                                            onSelectRecord(record);
                                                        }}
                                                        className="h-8 px-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1"
                                                    >
                                                        <span>Lihat Dokumen</span>
                                                        <ExternalLink size={13} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Transaction Description */}
                                            <div className="mt-3">
                                                <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-zinc-100 leading-snug">
                                                    {record.description}
                                                </h4>
                                                
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-slate-500 dark:text-zinc-400">
                                                    {record.vendor && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Store size={12} className="text-slate-400" />
                                                            Vendor: <strong className="text-slate-700 dark:text-zinc-200">{record.vendor}</strong>
                                                        </span>
                                                    )}
                                                    {record.department && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Briefcase size={12} className="text-slate-400" />
                                                            Dept: <strong className="text-slate-700 dark:text-zinc-200">{record.department}</strong>
                                                        </span>
                                                    )}
                                                    {record.category && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Tag size={12} className="text-slate-400" />
                                                            Kategori: <strong className="text-slate-700 dark:text-zinc-200">{record.category}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nested Items Breakdown */}
                                            {hasItems && (
                                                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 rounded-b-2xl space-y-2">
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                                        <Package size={12} />
                                                        <span>Rincian Barang yang Dibeli ({items.length} item):</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {items.map((it: any, itIdx: number) => {
                                                            const itQty = Number(it.qty || it.quantity || 1);
                                                            const itPrice = Number(it.price || it.unit_price || 0);
                                                            const itTotal = Number(it.total || (itQty * itPrice));

                                                            return (
                                                                <div 
                                                                    key={itIdx}
                                                                    className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-slate-200/50 dark:border-zinc-700/50"
                                                                >
                                                                    <div className="flex items-center gap-2 max-w-[70%]">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                                        <span className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                                                            {it.description || it.name || 'Barang'}
                                                                        </span>
                                                                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                                                                            ({itQty} unit @ {formatIDR(itPrice)})
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                                        {formatIDR(itTotal)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Items Aggregation Tab */
                        filteredAggregatedItems.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                                    <Package size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Tidak ada barang ditemukan</h3>
                                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Coba ubah kata kunci pencarian Anda.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800/40">
                                {filteredAggregatedItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-slate-500 dark:text-zinc-400 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-zinc-100 truncate">
                                                    {item.description}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                                    Terbeli <strong className="text-slate-700 dark:text-zinc-300">{item.totalQty} unit</strong> dari <strong className="text-slate-700 dark:text-zinc-300">{item.count} transaksi</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 flex items-center gap-3">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Total Belanja</span>
                                                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                                                    {formatIDR(item.totalCost)}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    onClose();
                                                    onSelectRecord(item.sampleRecord);
                                                }}
                                                title="Lihat transaksi terkait"
                                                className="w-8 h-8 p-0 rounded-lg text-slate-400 hover:text-blue-600"
                                            >
                                                <ArrowUpRight size={15} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Menampilkan <strong className="text-slate-800 dark:text-white">{activeTab === 'transactions' ? filteredRecords.length : filteredAggregatedItems.length}</strong> data
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {onApplyFilter && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onApplyFilter(type, name);
                                    onClose();
                                }}
                                className="text-xs font-bold gap-1.5"
                            >
                                <span>Filter Halaman Ini</span>
                                <ArrowRight size={13} />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={onClose}
                            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};
