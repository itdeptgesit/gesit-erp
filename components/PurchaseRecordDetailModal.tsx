'use client';

import React from 'react';
import {
    X, Calendar, ShieldCheck, FileText,
    Receipt, Fingerprint, Download,
    Building2, User, CheckCircle2, XCircle, Clock, ShieldAlert, Award, Briefcase,
    ExternalLink, ShoppingCart, CreditCard, Globe, Store, Tag, RefreshCcw, FileSpreadsheet
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { sendToGoogleSheet } from '../lib/googleSheets';
import { useState } from 'react';
import { useToast } from './ToastProvider';

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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <style>
                {`
          @media print {
            @page { 
                size: A4; 
                margin: 0; 
            }
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { 
              position: fixed; 
              left: 0; 
              top: 0; 
              width: 210mm;
              height: 297mm;
              padding: 20mm;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print { display: none !important; }
            .print-border { border: 1px solid #e2e8f0 !important; }
            .print-bg-gray { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          }
        `}
            </style>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Modal UI Header (Hidden in Print) */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 no-print">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Purchase Record Detail</h2>
                            <p className="text-xs text-slate-500 font-medium">Reference code: {record.transactionId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400" title="Print Invoice">
                            <Download size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Document Body */}
                <div id="printable-invoice" className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">

                    {/* Document Header - Branding */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                        <div className="flex items-center gap-4">
                            <img src="https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png" className="h-12 w-auto" alt="Logo" />
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Purchase Invoice</h1>
                                <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Gesit IT Asset Management</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Transaction ID</p>
                            <p className="text-xl font-mono font-black text-slate-900 leading-none">{record.transactionId}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-2 italic uppercase">Date: {record.purchaseDate}</p>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                    <User size={12} className="text-blue-500" /> Requester & Entity
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{record.user}</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                        <Briefcase size={10} className="text-blue-500 opacity-60" /> {record.department}
                                    </p>
                                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-widest pt-1 border-t border-slate-100 mt-1">
                                        <Building2 size={10} /> {record.company}
                                    </p>
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest shadow-sm">
                                        <Tag size={10} /> {record.category || 'Standard Procurement'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                    <ShoppingCart size={12} className="text-rose-500" /> Vendor & Platform
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">{record.vendor}</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                                        {record.platform === 'Market Place' ? <Globe size={10} /> : <Store size={10} />}
                                        {record.platform}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                    <CreditCard size={12} className="text-emerald-500" /> Payment Details
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Method</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{record.paymentMethod || '-'}</span>
                                    </div>
                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${statusCfg.bg} ${statusCfg.border}`}>
                                        <span className="text-[9px] font-black opacity-60 uppercase">Status</span>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${statusCfg.color}`}>
                                            {statusCfg.icon}
                                            {record.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {record.evidenceLink && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                        <ExternalLink size={12} className="text-blue-500" /> Evidence Attachment
                                    </h3>
                                    <a
                                        href={record.evidenceLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 break-all flex items-center gap-1 transition-colors"
                                    >
                                        <ExternalLink size={10} />
                                        View Documentation Folder (GDrive)
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Purchase Overview</h3>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 print-bg-gray print-border">
                            <p className="text-base font-bold text-slate-900 dark:text-white leading-tight underline decoration-blue-500/30 underline-offset-4">{record.description}</p>
                            {record.remarks && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 italic leading-relaxed">
                                    "{record.remarks}"
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Itemized List if available */}
                    {record.items && record.items.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Itemized Breakdown</h3>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print-border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 print-bg-gray">
                                        <tr className="text-[9px] font-black text-slate-500 uppercase">
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3 text-center w-16">Qty</th>
                                            <th className="px-6 py-3 text-right">Unit Price</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {record.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-xs">{item.description}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400 text-xs">{item.qty}x</td>
                                                <td className="px-6 py-4 text-right font-mono font-medium text-xs">{formatFullIDR(item.price)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">{formatFullIDR(item.price * item.qty)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Financial Summary */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Financial Summary</h3>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-emerald-500" /> Audit Compliance Trace
                                    </h4>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        {Object.entries(record.docs || {}).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${value ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
                                                    {value ? <CheckCircle2 size={10} /> : <X size={8} />}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-tight ${value ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 opacity-50'}`}>
                                                    {key.replace(/([A-Z])/g, ' $1')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Receipt size={140} />
                                </div>
                                <div className="space-y-3 relative">
                                    <div className="flex justify-between items-center text-[11px] font-bold opacity-50 border-b border-white/10 pb-2">
                                        <span className="uppercase tracking-[0.1em]">Principal Amount</span>
                                        <span className="font-mono">{formatFullIDR(record.subtotal - (record.vat || 0) - (record.otherCost || 0))}</span>
                                    </div>
                                    {(record.vat || 0) > 0 && (
                                        <div className="flex justify-between items-center text-[11px] font-bold opacity-50 border-b border-white/10 pb-2">
                                            <span className="uppercase tracking-[0.1em]">Value Added Tax (PPN)</span>
                                            <span className="font-mono">{formatFullIDR(record.vat)}</span>
                                        </div>
                                    )}
                                    {(record.otherCost || 0) > 0 && (
                                        <div className="flex justify-between items-center text-[11px] font-bold opacity-50 border-b border-white/10 pb-2">
                                            <span className="uppercase tracking-[0.1em]">Other Applied Charges</span>
                                            <span className="font-mono">{formatFullIDR(record.otherCost)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 block mb-1">Audit Ledger Total</span>
                                            <span className="text-3xl font-mono font-black tracking-tighter">{formatFullIDR(record.subtotal)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase border border-blue-500/30">Cleared</span>
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest pt-4 border-t border-white/5">Digital signature and ledger trace embedded in QR/Hash</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Signatures */}
                    <div className="pt-16 border-t border-slate-100 grid grid-cols-3 gap-10 border-b border-slate-50 pb-8">
                        <div className="space-y-12">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prepared By</p>
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-slate-900">{record.user}</p>
                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-none">Authorization Holder</p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finance Approval</p>
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-slate-900 italic">................................</p>
                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-none">Internal Audit Unit</p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Record</p>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Input By</p>
                                <p className="font-bold text-xs text-slate-700">{record.inputBy || 'System'}</p>
                                <p className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter italic">Verified Digital Timestamp</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-end">
                        <div className="text-right flex flex-col items-end space-y-2 ml-auto">
                            <div className="inline-block p-2 border border-slate-200 rounded-lg bg-slate-50 mb-2">
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Digital Auth Trace</p>
                                <p className="text-[8px] font-mono text-slate-400 uppercase">INV_{record.transactionId}_{new Date().getFullYear()}</p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                                ID: PR-{record.id} <br />
                                Trace: {new Date().toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Actions (Hidden in Print) */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3 no-print shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-800 transition-all border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                    >
                        Close Trace
                    </button>
                    <button
                        onClick={async () => {
                            setIsSyncing(true);
                            await sendToGoogleSheet(record);
                            setIsSyncing(false);
                            showToast('Synced to Google Sheets!');
                        }}
                        disabled={isSyncing}
                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSyncing ? <RefreshCcw className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                        {isSyncing ? 'Syncing...' : 'Sync to Sheet'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95"
                    >
                        <Download size={16} /> Export Document
                    </button>
                </div>
            </div>
        </div>
    );
};

const HelpCircle = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
