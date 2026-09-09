'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Calendar, ShieldCheck, FileText,
    Receipt, Download, Building2, User, CheckCircle2,
    XCircle, Clock, ShieldAlert, Briefcase, ExternalLink,
    ShoppingCart, CreditCard, Globe, Store, Tag, RefreshCcw,
    FileSpreadsheet, Printer, DollarSign, ArrowDownCircle,
    Check, Sparkles, Layers, Package, ArrowUpRight
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { sendToGoogleSheet } from '../lib/googleSheets';
import { useToast } from './ToastProvider';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PurchaseRecordDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PurchaseRecord | any | null;
}

export const PurchaseRecordDetailModal: React.FC<PurchaseRecordDetailModalProps> = ({ isOpen, onClose, record }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const { showToast } = useToast();

    // Defensive parsing for record properties
    const transactionId = record?.transactionId || record?.transaction_id || `TR-${record?.id || '000'}`;
    const purchaseDate = record?.purchaseDate || record?.purchase_date || '-';
    const paymentDate = record?.paymentDate || record?.payment_date || purchaseDate;
    const paymentMethod = record?.paymentMethod || record?.payment_method || 'Transfer';
    const evidenceLink = record?.evidenceLink || record?.evidence_link || '';
    const projectName = record?.projectName || record?.project_name || '-';
    const inputBy = record?.inputBy || record?.input_by || 'System Automation';
    const user = record?.user || record?.user_name || '-';
    const department = record?.department || 'IT';
    const company = record?.company || 'THE GESIT COMPANIES';
    const category = record?.category || 'Hardware';
    const status = record?.status || 'Paid';
    const description = record?.description || 'Purchase Request';
    const vendor = record?.vendor || 'Authorized Vendor';
    const platform = record?.platform || '-';
    const subtotal = Number(record?.subtotal) || Number(record?.total_va) || 0;
    const qty = Number(record?.qty) || 1;
    const remarks = record?.remarks || '';

    // Parse items array safely
    const parsedItems = useMemo(() => {
        if (!record?.items) return [];
        if (Array.isArray(record.items)) return record.items;
        if (typeof record.items === 'string') {
            try {
                const parsed = JSON.parse(record.items);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }, [record?.items]);

    // Parse docs safely
    const parsedDocs = useMemo(() => {
        if (!record?.docs) return {};
        if (typeof record.docs === 'string') {
            try { return JSON.parse(record.docs); } catch { return {}; }
        }
        return record.docs;
    }, [record?.docs]);

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    // Parse settlement info if present in remarks
    const settlementData = useMemo(() => {
        if (!remarks) return null;
        const match = remarks.match(/\[Expense Approval Settled:\s*(?:CA Rp\s*([\d.,]+),\s*Aktual Rp\s*([\d.,]+),\s*Kembali Rp\s*([\d.,]+)|Refund Rp\s*([\d.,]+))\]/i);
        const prMatch = remarks.match(/\[(?:PR\s*#?|PR-)(\d+)\]/i);

        if (!match) return null;

        const parseNum = (str: string) => {
            if (!str) return 0;
            const clean = str.replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(clean) || 0;
        };

        if (match[1] && match[2]) {
            return {
                isSettled: true,
                caAmount: parseNum(match[1]),
                actualAmount: parseNum(match[2]),
                refundAmount: parseNum(match[3]),
                prId: prMatch ? prMatch[1] : null
            };
        } else if (match[4]) {
            return {
                isSettled: true,
                caAmount: subtotal + parseNum(match[4]),
                actualAmount: subtotal,
                refundAmount: parseNum(match[4]),
                prId: prMatch ? prMatch[1] : null
            };
        }
        return null;
    }, [remarks, subtotal]);

    // Clean notes without raw tags
    const cleanRemarks = useMemo(() => {
        if (!remarks) return '';
        return remarks
            .replace(/\[Expense Approval Settled:[^\]]+\]/gi, '')
            .replace(/\[(?:PR\s*#?|PR-)\d+\]/gi, '')
            .trim();
    }, [remarks]);

    const docItems = [
        { key: 'prForm', label: 'PR Form', desc: 'Requisition' },
        { key: 'cashAdvance', label: 'Cash Advance', desc: 'CA Voucher' },
        { key: 'checkout', label: 'Checkout', desc: 'Order Proof' },
        { key: 'paymentSlip', label: 'Payment Slip', desc: 'Transfer / VA' },
        { key: 'invoice', label: 'Official Invoice', desc: 'Faktur / Receipt' },
        { key: 'expenseApproval', label: 'Expense Approval', desc: 'Settlement' },
        { key: 'checkByRara', label: 'Audited by Finance', desc: 'Verification' }
    ];

    const verifiedDocsCount = docItems.filter(item => !!parsedDocs?.[item.key as keyof typeof parsedDocs]).length;
    const docProgressPercent = Math.round((verifiedDocsCount / docItems.length) * 100);

    const isPaid = status === 'Paid';

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen || !record) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-print">
            <style>
                {`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 12mm; 
                    }
                    body * { visibility: hidden; }
                    #printable-invoice, #printable-invoice * { visibility: visible; }
                    #printable-invoice { 
                        position: fixed; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        padding: 0;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print { display: none !important; }
                }
                `}
            </style>

            <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] border border-slate-200 dark:border-zinc-800 overflow-hidden">
                
                {/* Top Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight">
                                    Purchase Details
                                </h2>
                                <span className={cn(
                                    "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                                    isPaid 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                                )}>
                                    {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                    {status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">{company}</span>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Divisi {department}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Transaction ID</div>
                            <div className="text-lg font-mono font-black text-blue-600 dark:text-blue-400 tracking-tight">{transactionId}</div>
                            <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                                <Calendar size={11} />
                                {purchaseDate}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 space-y-6">
                    <div id="printable-invoice" className="space-y-6">

                        {/* Top 3 KPI Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Fiscal Value */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-white dark:from-zinc-900 dark:to-zinc-900/60 border border-blue-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                                        Total Realisasi Belanja
                                    </span>
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <DollarSign size={15} />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono tracking-tight">
                                    {formatIDR(subtotal)}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                                    <Package size={12} className="text-blue-500" />
                                    <span>Total Kuantitas: <strong>{qty} unit</strong> ({parsedItems.length || 1} rincian item)</span>
                                </div>
                            </div>

                            {/* Card 2: Vendor & Payment */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-zinc-900 dark:to-zinc-900/60 border border-indigo-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                                        Vendor & Pembayaran
                                    </span>
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <CreditCard size={15} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-slate-900 dark:text-zinc-100 truncate">
                                    {vendor}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                                        {paymentMethod}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                                        Platform: {platform}
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Audit Compliance Progress */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-zinc-900 dark:to-zinc-900/60 border border-emerald-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                        Kepatuhan Dokumen Audit
                                    </span>
                                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                        <ShieldCheck size={15} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                        {verifiedDocsCount} / {docItems.length}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        Dokumen Lengkap ({docProgressPercent}%)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${docProgressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Settlement Banner if Settled */}
                        {settlementData && (
                            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-900/40 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1 bg-emerald-600 text-white rounded-md">
                                            <ArrowDownCircle size={14} />
                                        </span>
                                        <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                            Penyelesaian Cash Advance (Settled)
                                        </h4>
                                        {settlementData.prId && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md font-mono">
                                                PR-{String(settlementData.prId).padStart(4, '0')}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                                        Voucher Expense Approval Terbit
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                                    <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Plafon Awal Cash Advance (CA)</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-sm">
                                            Rp {formatNumber(settlementData.caAmount)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Realisasi Pengeluaran Riil</span>
                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                            Rp {formatNumber(settlementData.actualAmount)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">Dana Dikembalikan ke Kas</span>
                                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                                            +Rp {formatNumber(Math.abs(settlementData.refundAmount))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main 2-Column Content Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* --- LEFT COLUMN: ITEM DETAILS & PROFILE (7 COLS) --- */}
                            <div className="lg:col-span-7 space-y-6">

                                {/* Requester & Procurement Metadata */}
                                <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/70 dark:border-zinc-800 space-y-4">
                                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-zinc-800">
                                        <User size={14} className="text-blue-500" />
                                        Informasi Pemohon & Kategori
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Pemohon / User</span>
                                            <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{user}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Kategori Pengadaan</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2.5 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-md">
                                                <Layers size={11} className="text-indigo-500" />
                                                {category}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Proyek / Alokasi</span>
                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{projectName}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Petugas Input / Sistem</span>
                                            <span className="font-medium text-slate-500 dark:text-zinc-400">{inputBy}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Description / Project Subject */}
                                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Judul & Deskripsi Pengadaan
                                    </span>
                                    <p className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                                        "{description}"
                                    </p>
                                </div>

                                {/* Itemized Table */}
                                {parsedItems.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                                                <Tag size={14} className="text-blue-500" />
                                                Rincian Item Pembelian ({parsedItems.length})
                                            </h3>
                                        </div>

                                        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800">
                                                    <tr className="text-[9px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest">
                                                        <th className="px-5 py-3">Nama Barang / Spesifikasi</th>
                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                        <th className="px-4 py-3 text-right">Harga Satuan</th>
                                                        <th className="px-5 py-3 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                                    {parsedItems.map((item: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                            <td className="px-5 py-3.5">
                                                                <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs mb-0.5">{item.description || '-'}</p>
                                                                {item.vendor && (
                                                                    <span className="text-[9px] text-slate-400 font-medium">Vendor: {item.vendor}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className="font-bold font-mono px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-700 dark:text-zinc-300">
                                                                    {item.qty || 1}x
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-right font-mono text-slate-600 dark:text-zinc-400">
                                                                {formatIDR(Number(item.price) || 0)}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                                                {formatIDR((Number(item.price) || 0) * (Number(item.qty) || 1))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-slate-50/70 dark:bg-zinc-800/40 border-t border-slate-200 dark:border-zinc-800">
                                                    <tr>
                                                        <td colSpan={3} className="px-5 py-3 font-bold text-slate-600 dark:text-zinc-400 uppercase text-[10px] tracking-wider text-right">
                                                            Total Subtotal
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-mono font-black text-slate-900 dark:text-zinc-100 text-sm">
                                                            {formatIDR(subtotal)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- RIGHT COLUMN: COMPLIANCE & NOTES (5 COLS) --- */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* Document Compliance Matrix */}
                                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            Kelengkapan Dokumen Audit
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {verifiedDocsCount} / {docItems.length}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {docItems.map((item) => {
                                            const isChecked = !!parsedDocs?.[item.key as keyof typeof parsedDocs];
                                            return (
                                                <div
                                                    key={item.key}
                                                    className={cn(
                                                        "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all",
                                                        isChecked
                                                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-zinc-200"
                                                            : "bg-slate-50/40 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                            isChecked ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-400"
                                                        )}>
                                                            {isChecked ? <Check size={12} strokeWidth={3} /> : <X size={10} />}
                                                        </div>
                                                        <span className={cn("font-bold text-xs", isChecked ? "text-slate-800 dark:text-zinc-100" : "")}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {isChecked ? 'Terverifikasi' : 'Belum Ada'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {evidenceLink && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                                            <a
                                                href={evidenceLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all border border-blue-200 dark:border-blue-900/40"
                                            >
                                                <ExternalLink size={13} />
                                                Buka Dokumen Bukti Pembelian / Invoice
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Remarks & Operational Notes */}
                                {cleanRemarks && (
                                    <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 pb-1 border-b border-amber-200/50 dark:border-amber-900/30">
                                            <ShieldAlert size={14} />
                                            <h4 className="text-xs font-black uppercase tracking-wider">Catatan Tambahan (Remarks)</h4>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line pt-1">
                                            {cleanRemarks}
                                        </p>
                                    </div>
                                )}

                                {/* System Audit Seal */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 text-center space-y-1">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Ledger Audit ID</div>
                                    <div className="font-mono text-[10px] font-bold text-slate-600 dark:text-zinc-300 select-all">
                                        GESIT_PR_{(transactionId || '').replace(/-/g, '_')}_VERIFIED
                                    </div>
                                    <div className="text-[8px] text-slate-400">
                                        Database ID: #{record?.id} • Terdaftar di Log Finansial
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 shrink-0 flex flex-row justify-between items-center no-print">
                    <Button variant="outline" onClick={onClose} className="text-xs font-bold">
                        Tutup
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                setIsSyncing(true);
                                try {
                                    await sendToGoogleSheet(record);
                                    showToast('Berhasil disinkronkan ke Google Sheet!', 'success');
                                } catch (e: any) {
                                    showToast('Gagal sinkronisasi: ' + (e.message || ''), 'error');
                                } finally {
                                    setIsSyncing(false);
                                }
                            }}
                            disabled={isSyncing}
                            className="text-xs font-bold gap-2 border-slate-200 dark:border-zinc-700"
                        >
                            {isSyncing ? <RefreshCcw className="animate-spin" size={14} /> : <FileSpreadsheet className="text-emerald-600" size={14} />}
                            {isSyncing ? 'Menyinkronkan...' : 'Sync ke Google Sheet'}
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="text-xs font-bold gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <Printer size={14} /> Cetak / Print Record
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
