'use client';

import React from 'react';
import {
    X, Calendar, ShieldCheck, FileText,
    Receipt, Fingerprint, Download,
    Building2, User, CheckCircle2, XCircle, Clock, ShieldAlert, Award, Briefcase,
    ExternalLink, ShoppingCart, CreditCard, Globe, Store, Tag, RefreshCcw, FileSpreadsheet, HelpCircle, Eye, Printer, DollarSign
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { sendToGoogleSheet } from '../lib/googleSheets';
import { useState } from 'react';
import { useToast } from './ToastProvider';

// SHADCN UI IMPORTS
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PurchaseRecordDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PurchaseRecord | null;
}

export const PurchaseRecordDetailModal: React.FC<PurchaseRecordDetailModalProps> = ({ isOpen, onClose, record }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const { showToast } = useToast();

    if (!isOpen || !record) return null;

    const formatFullIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const getStatusConfig = (status: string) => {
        if (status === 'Paid') return {
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            icon: <CheckCircle2 size={16} />
        };
        if (status === 'Pending') return {
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            icon: <Clock size={16} />
        };
        return {
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            icon: <HelpCircle size={16} />
        };
    };

    const handlePrint = () => {
        window.print();
    };

    const statusCfg = getStatusConfig(record.status);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] p-0 overflow-hidden rounded-xl border shadow-2xl bg-background flex flex-col no-print">
                <style>
                    {`
                    @media print {
                        @page { 
                            size: A4 landscape; 
                            margin: 10mm; 
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

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div id="printable-invoice" className="p-8 space-y-10 bg-background">
                        {/* Branding Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 shrink-0">
                                    <ShieldCheck className="text-primary-foreground" size={28} />
                                </div>
                                <div className="text-left">
                                    <DialogTitle render={<h1 className="text-3xl font-bold text-foreground tracking-tight uppercase leading-none">Purchase Details</h1>} />
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-2">IT Asset Management</p>
                                </div>
                            </div>
                            <div className="text-left md:text-right space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Transaction ID</p>
                                <p className="text-2xl font-mono font-bold text-primary leading-none tracking-tighter">{record.transactionId}</p>
                                <div className="flex md:justify-end gap-2 pt-1">
                                    <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest bg-muted/20 border-none px-2 py-0.5">{record.purchaseDate}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* --- LEFT COLUMN: CORE DETAILS (7/12) --- */}
                            <div className="lg:col-span-7 space-y-12">
                                {/* Info Sections Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                                            <User size={12} className="text-primary" /> Basic Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Requester Name</p>
                                                <p className="text-xl font-bold text-foreground uppercase tracking-tight">{record.user}</p>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                        <Briefcase size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Department</p>
                                                        <p className="text-xs font-bold uppercase">{record.department}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                        <Building2 size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Company</p>
                                                        <p className="text-xs font-bold uppercase">{record.company}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                                            <ShoppingCart size={12} className="text-primary" /> Vendor & Platform
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Vendor</p>
                                                <p className="text-xl font-bold text-foreground uppercase tracking-tight">{record.vendor}</p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-xl border w-fit">
                                                {record.platform === 'Market Place' ? <Globe size={14} className="text-blue-500" /> : <Store size={14} className="text-amber-500" />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{record.platform}</span>
                                            </div>
                                            {record.evidenceLink && (
                                                <div className="pt-2">
                                                    <Button variant="outline" size="sm" render={<a href={record.evidenceLink} target="_blank" rel="noopener noreferrer" />} className="font-bold text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/5">
                                                            <ExternalLink size={14} className="mr-2" />
                                                            View Evidence
                                                    </Button>

                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Overview */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b pb-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Description</h3>
                                    </div>
                                    <div className="p-6 bg-muted/5 rounded-xl border relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                                        <p className="text-xl font-bold text-foreground leading-tight italic tracking-tight">"{record.description}"</p>
                                    </div>
                                </div>

                                {/* Itemized List */}
                                {record.items && record.items.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                            <Tag size={12} className="text-primary" /> Items
                                        </h3>
                                        <div className="border rounded-xl overflow-hidden shadow-sm bg-muted/5">
                                            <table className="w-full text-left text-sm border-collapse">
                                                <thead className="bg-muted/30">
                                                    <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <th className="px-6 py-3">Item Details</th>
                                                        <th className="px-6 py-3 text-center">Qty</th>
                                                        <th className="px-6 py-3 text-right">Unit Val</th>
                                                        <th className="px-6 py-3 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-muted/50">
                                                    {record.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-foreground text-[11px] uppercase leading-none mb-1">{item.description}</p>
                                                                <p className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase opacity-60 italic">{item.vendor || 'Authorized'}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="font-bold text-xs opacity-50">{item.qty}x</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono font-medium text-[10px] opacity-70">{formatFullIDR(item.price)}</td>
                                                            <td className="px-6 py-4 text-right font-mono font-bold text-primary text-xs tracking-tighter">{formatFullIDR(item.price * item.qty)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- RIGHT COLUMN: AUDIT & SUMMARY (5/12) --- */}
                            <div className="lg:col-span-5 space-y-8">
                                {/* Payment & Ledger Detail Card */}
                                <div className="bg-slate-50/50 dark:bg-zinc-900/10 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/50">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={14} className="text-slate-400 dark:text-zinc-500" />
                                                <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Financial Summary</h3>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Method</span>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{record.paymentMethod || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Ledger Date</span>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{record.paymentDate || record.purchaseDate}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Status</span>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border",
                                                    statusCfg.bg, statusCfg.color, statusCfg.border
                                                )}>
                                                    {statusCfg.icon && React.isValidElement(statusCfg.icon)
                                                        ? React.cloneElement(statusCfg.icon as React.ReactElement<any>, { size: 10 })
                                                        : statusCfg.icon}
                                                    {record.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-zinc-800/50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Total Amount</p>
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight font-mono">{formatFullIDR(record.subtotal || 0)}</p>
                                        </div>
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/10 shrink-0">
                                            <DollarSign size={14} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                {record.remarks && (
                                    <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/40">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                                                <ShieldAlert size={14} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Remarks / Notes</p>
                                                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 leading-relaxed italic">"{record.remarks}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Compliance Matrix */}
                                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-zinc-800/50 flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-emerald-500" /> Checklist / Documents
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries({
                                            prForm: 'PR Form',
                                            checkout: 'Checkout',
                                            paymentSlip: 'Slip',
                                            invoice: 'Invoice',
                                            checkByRara: 'Audited'
                                        }).map(([key, label]) => {
                                            const isChecked = !!record.docs?.[key as keyof typeof record.docs];
                                            return (
                                                <div
                                                    key={key}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-extrabold uppercase tracking-wider transition-all",
                                                        isChecked
                                                            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40 shadow-sm'
                                                            : 'bg-slate-50/30 dark:bg-zinc-900/10 text-slate-400 dark:text-zinc-600 border-slate-200/40 dark:border-zinc-800/40 opacity-40 shadow-none'
                                                    )}
                                                >
                                                    <CheckCircle2 size={12} className={isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-zinc-700'} />
                                                    {label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Certification Meta */}
                                <div className="pt-4 space-y-3 text-center border-t border-slate-100 dark:border-zinc-800/50">
                                    <div className="inline-block px-4 py-3 bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl border border-slate-200/40 dark:border-zinc-800/40 text-[9px] font-semibold text-slate-500 dark:text-zinc-400">
                                        <div className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-1">Digital Verification ID</div>
                                        <div className="font-mono text-[9px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-widest select-all">
                                            GESIT_PR_{(record.transactionId || '').replace(/-/g, '_')}_AUDIT
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest opacity-80">
                                        Record ID: {record.id.toString().padStart(6, '0')} • System Generation: {new Date().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-4 border-t shrink-0 flex flex-row justify-end items-center gap-3 no-print">
                    <Button variant="outline" onClick={onClose} className="text-[10px] font-bold uppercase tracking-wider border hover:bg-muted/50 transition-all">
                        Close
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            setIsSyncing(true);
                            await sendToGoogleSheet(record);
                            setIsSyncing(false);
                            showToast('Synced to digital cloud repository!');
                        }}
                        disabled={isSyncing}
                        className="text-[10px] font-bold uppercase tracking-wider border border-emerald-200 transition-all"
                    >
                        {isSyncing ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <FileSpreadsheet className="mr-2" size={14} />}
                        {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                        <Printer className="mr-2" size={14} /> Print Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
