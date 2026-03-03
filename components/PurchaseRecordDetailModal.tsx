'use client';

import React from 'react';
import {
    X, Calendar, ShieldCheck, FileText,
    Receipt, Fingerprint, Download,
    Building2, User, CheckCircle2, XCircle, Clock, ShieldAlert, Award, Briefcase,
    ExternalLink, ShoppingCart, CreditCard, Globe, Store, Tag, RefreshCcw, FileSpreadsheet, HelpCircle, Eye, Printer
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

                <DialogHeader className="px-8 py-6 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border",
                            statusCfg.bg, statusCfg.color, statusCfg.border
                        )}>
                            {statusCfg.icon && React.isValidElement(statusCfg.icon)
                                ? React.cloneElement(statusCfg.icon as React.ReactElement<any>, { size: 20 })
                                : statusCfg.icon}
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                Purchase Audit Detail
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 opacity-60">Secured Document Traceability</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div id="printable-invoice" className="p-8 space-y-10 bg-background">
                        {/* Branding Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 shrink-0">
                                    <ShieldCheck className="text-primary-foreground" size={28} />
                                </div>
                                <div className="text-left">
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase leading-none">Purchase Invoice</h1>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-2">IT Asset Management</p>
                                </div>
                            </div>
                            <div className="text-left md:text-right space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Audit Ledger Entry</p>
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
                                            <User size={12} className="text-primary" /> Requester & Entity
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Full Name</p>
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
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Authorized Vendor</p>
                                                <p className="text-xl font-bold text-foreground uppercase tracking-tight">{record.vendor}</p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-xl border w-fit">
                                                {record.platform === 'Market Place' ? <Globe size={14} className="text-blue-500" /> : <Store size={14} className="text-amber-500" />}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{record.platform}</span>
                                            </div>
                                            {record.evidenceLink && (
                                                <div className="pt-2">
                                                    <Button variant="outline" size="sm" asChild className="rounded-xl font-bold text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/5 h-10 px-5">
                                                        <a href={record.evidenceLink} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink size={14} className="mr-2" />
                                                            View Evidence
                                                        </a>
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
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Procurement Overview</h3>
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
                                            <Tag size={12} className="text-primary" /> Itemized Ledger Breakdown
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
                            <div className="lg:col-span-5 space-y-10">
                                {/* Payment & Ledger Detail */}
                                <div className="bg-slate-950 p-6 rounded-xl text-white shadow-xl relative overflow-hidden group border border-slate-800">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                        <CreditCard size={60} />
                                    </div>
                                    <div className="relative space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                                                <CreditCard size={16} />
                                            </div>
                                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/70">Audit Ledger</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="opacity-40 font-bold uppercase tracking-wider text-[9px]">Method</span>
                                                <span className="font-medium">{record.paymentMethod || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="opacity-40 font-bold uppercase tracking-wider text-[9px]">Ledger Date</span>
                                                <span className="font-medium">{record.paymentDate || record.purchaseDate}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="opacity-40 font-bold uppercase tracking-wider text-[9px]">Audit Status</span>
                                                <div className={cn("flex items-center gap-2 font-bold uppercase text-[10px]", statusCfg.color)}>
                                                    {statusCfg.icon && React.isValidElement(statusCfg.icon)
                                                        ? React.cloneElement(statusCfg.icon as React.ReactElement<any>, { size: 12 })
                                                        : statusCfg.icon}
                                                    {record.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Verified Liability</p>
                                                <p className="text-2xl font-mono font-bold text-primary tracking-tighter">{formatFullIDR(record.subtotal || 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                {record.remarks && (
                                    <div className="p-6 bg-amber-50/50 rounded-xl border border-amber-200">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                                                <ShieldAlert size={16} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest opacity-70">Internal Audit Remarks</p>
                                                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">"{record.remarks}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Compliance Matrix */}
                                <div className="bg-emerald-600/5 p-8 rounded-xl border border-emerald-600/10 space-y-6">
                                    <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ShieldCheck size={16} /> Documentation Matrix
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries({
                                            prForm: 'PR Form',
                                            checkout: 'Checkout',
                                            paymentSlip: 'Slip',
                                            invoice: 'Invoice',
                                            checkByRara: 'Audited'
                                        }).map(([key, label]) => (
                                            <div
                                                key={key}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all",
                                                    record.docs?.[key as keyof typeof record.docs]
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl'
                                                        : 'bg-background text-muted-foreground border-muted-foreground/10 opacity-30 shadow-none'
                                                )}
                                            >
                                                <CheckCircle2 size={12} className={record.docs?.[key as keyof typeof record.docs] ? 'text-white' : 'text-muted-foreground'} />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Certification Meta */}
                                <div className="pt-6 space-y-4 text-center">
                                    <div className="inline-block p-5 bg-muted/10 rounded-xl border-2 border-dashed border-muted relative group">
                                        <Award className="absolute -top-4 -right-4 text-primary bg-background rounded-full p-1 border-2 border-background" size={32} />
                                        <p className="text-[8px] font-bold text-primary uppercase tracking-[0.4em] mb-1">Digital Certification ID</p>
                                        <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-[0.2em]">GESIT_PR_{(record.transactionId || '').replace(/-/g, '_')}_AUDIT</p>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                                        Record ID: {record.id.toString().padStart(6, '0')} • System Generation: {new Date().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-4 border-t shrink-0 flex flex-row justify-end items-center gap-3 no-print">
                    <Button variant="outline" onClick={onClose} className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-wider border hover:bg-muted/50 transition-all">
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
                        className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                    >
                        {isSyncing ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <FileSpreadsheet className="mr-2" size={14} />}
                        {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Printer className="mr-2" size={14} /> Print Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
