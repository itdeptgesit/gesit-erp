'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Download, ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, User, HelpCircle, DollarSign } from 'lucide-react';
import { PurchaseRequisition, UserAccount } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { exportPurchaseRequisitionPDF } from '../lib/prPdfExport';

interface PurchaseRequisitionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisition: PurchaseRequisition | null;
    currentUser: UserAccount | null;
    onApprove?: (req: PurchaseRequisition) => void;
    onReject?: (req: PurchaseRequisition) => void;
    usdRate?: number;
}

export const PurchaseRequisitionDetailModal: React.FC<PurchaseRequisitionDetailModalProps> = ({
    isOpen,
    onClose,
    requisition,
    currentUser,
    onApprove,
    onReject,
    usdRate = 16300
}) => {
    if (!isOpen || !requisition) return null;

    const formatCurrency = (num: number, currency: string = 'IDR') => {
        const c = String(currency || 'IDR').toUpperCase();
        if (c.includes('USD') || c === 'DOLLAR') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2
            }).format(num);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    // Determine if it is current user's turn to approve
    const getActiveApproverId = () => {
        if (requisition.status === 'Pending Supervisor') return requisition.supervisorId;
        if (requisition.status === 'Pending VP') return requisition.vpId;
        if (requisition.status === 'Pending Finance') return requisition.financeId;
        if (requisition.status === 'Pending Accounting') return requisition.accountingId;
        return null;
    };

    const isMyTurn = currentUser && getActiveApproverId() === String(currentUser.id) && requisition.status !== 'Approved' && requisition.status !== 'Rejected';

    const getApprovalTimeline = () => {
        return [
            {
                role: 'Pemohon',
                name: requisition.requesterFullname,
                date: requisition.requestDate,
                status: 'Approved',
                color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
            },
            {
                role: 'Atasan Langsung',
                name: requisition.supervisorName || 'Supervisor',
                date: requisition.supervisorApprovedAt ? new Date(requisition.supervisorApprovedAt).toLocaleDateString('id-ID') : null,
                status: requisition.supervisorApprovedAt ? 'Approved' : (requisition.status === 'Pending Supervisor' ? 'Active' : (requisition.status === 'Rejected' && requisition.rejectedBy === requisition.supervisorId ? 'Rejected' : 'Pending')),
                color: requisition.supervisorApprovedAt ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : (requisition.status === 'Pending Supervisor' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : (requisition.status === 'Rejected' && requisition.rejectedBy === requisition.supervisorId ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-slate-400 bg-slate-100 dark:bg-zinc-800 border-transparent'))
            },
            {
                role: 'VP HR & Logistic',
                name: requisition.vpName || 'VP',
                date: requisition.vpApprovedAt ? new Date(requisition.vpApprovedAt).toLocaleDateString('id-ID') : null,
                status: requisition.vpApprovedAt ? 'Approved' : (requisition.status === 'Pending VP' ? 'Active' : (requisition.status === 'Rejected' && requisition.rejectedBy === requisition.vpId ? 'Rejected' : 'Pending')),
                color: requisition.vpApprovedAt ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : (requisition.status === 'Pending VP' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : (requisition.status === 'Rejected' && requisition.rejectedBy === requisition.vpId ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-slate-400 bg-slate-100 dark:bg-zinc-800 border-transparent'))
            }
        ];
    };

    const handleDownload = () => {
        exportPurchaseRequisitionPDF(requisition);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-4xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] border border-slate-200 dark:border-zinc-800">
                
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-md shadow-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Requisition ID: PR-{String(requisition.id).padStart(4, '0')}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Formal Procurement Requisition Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs h-9 font-bold uppercase tracking-wider flex items-center gap-2 border-slate-200 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                            <Download size={14} /> Export PDF
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    
                    {/* Visual Stage Workflow Bar */}
                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Approval Chain Timeline</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {getApprovalTimeline().map((step, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all duration-300 ${step.color}`}>
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-black uppercase tracking-wider">{step.role}</span>
                                            {step.status === 'Approved' && <CheckCircle2 size={13} className="text-emerald-500" />}
                                            {step.status === 'Active' && <Clock size={13} className="text-amber-500 animate-pulse" />}
                                            {step.status === 'Rejected' && <AlertTriangle size={13} className="text-rose-500" />}
                                        </div>
                                        <span className="text-xs font-bold block mt-1.5 truncate max-w-[130px]">{step.name}</span>
                                    </div>
                                    <div className="text-[9px] font-medium text-slate-400">
                                        {step.status === 'Approved' && step.date ? `Approved: ${step.date}` : ''}
                                        {step.status === 'Active' && 'WAITING YOUR SIGN'}
                                        {step.status === 'Pending' && 'PENDING'}
                                        {step.status === 'Rejected' && 'REJECTED'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reject Reason Banner if Rejected */}
                    {requisition.status === 'Rejected' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-xl flex items-start gap-4">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Requisition Rejected</h4>
                                <p className="text-xs text-slate-700 dark:text-zinc-300 italic">
                                    "{requisition.rejectReason || 'No rejection reason specified.'}"
                                </p>
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mt-2">
                                    Rejected By {requisition.rejectedBy || 'Approver'} at {requisition.rejectedAt ? new Date(requisition.rejectedAt).toLocaleString() : ''}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Metadata summary (Forms layout mirroring PDF) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-zinc-800/10 p-6 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nama Pemohon</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{requisition.requesterFullname}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Departemen</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{requisition.department}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tanggal Request</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                    {new Date(requisition.requestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Paid To</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{requisition.paidTo || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">No. Rekening</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{requisition.bankAccount || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Document Status</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">{requisition.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Requested items table layout */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">1. Permohonan dari Pengguna</h4>
                        <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="py-3 px-6 w-16 text-center">No</th>
                                        <th className="py-3 px-6">Jenis Barang / Asset</th>
                                        <th className="py-3 px-6 w-32 text-center">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-slate-700 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-zinc-800">
                                    {(requisition.requestedItems || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-6 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-3 px-6 font-bold">{item.description}</td>
                                            <td className="py-3 px-6 text-center font-bold">{item.qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* IT Recommendations table layout */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">2. Rekomendasi oleh IT</h4>
                        <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="py-3 px-6 w-16 text-center">No</th>
                                        <th className="py-3 px-6">Rekomendasi Barang / Spesifikasi</th>
                                        <th className="py-3 px-6 w-24 text-center">Jumlah</th>
                                        <th className="py-3 px-6 w-40">Rekomendasi Vendor</th>
                                        <th className="py-3 px-6 w-40 text-right">Harga</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-slate-700 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-zinc-800">
                                    {(requisition.itRecommendations || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-6 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-3 px-6 font-bold">{item.description}</td>
                                            <td className="py-3 px-6 text-center font-bold">{item.qty}</td>
                                            <td className="py-3 px-6 font-bold">{item.vendor}</td>
                                            <td className="py-3 px-6 text-right font-mono font-bold">{item.price && item.price > 0 ? formatCurrency(item.price, requisition.currency) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Note details */}
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Catatan Tambahan</span>
                        <p className="text-xs text-slate-700 dark:text-zinc-300 italic bg-slate-50/50 dark:bg-zinc-800/10 p-4 rounded-lg border border-slate-100 dark:border-zinc-800/50 leading-relaxed">
                            {requisition.notes || '-'}
                        </p>
                    </div>

                    {/* Grand Total display */}
                    <div className="bg-slate-50/50 dark:bg-zinc-900/10 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-7 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-zinc-800/50">Rincian Komitmen Biaya</h4>
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex justify-between max-w-md">
                                    <span>Subtotal Item IT</span>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                        {formatCurrency((requisition.itRecommendations || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0), requisition.currency)}
                                    </span>
                                </div>
                                {requisition.discount && requisition.discount > 0 ? (
                                    <div className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex justify-between max-w-md">
                                        <span>Diskon Pembelian</span>
                                        <span className="font-mono font-semibold">
                                            -{formatCurrency(requisition.discount, requisition.currency)}
                                        </span>
                                    </div>
                                ) : null}
                                {requisition.deliveryFee && requisition.deliveryFee > 0 ? (
                                    <div className="text-[11px] font-medium text-blue-500 dark:text-blue-400 flex justify-between max-w-md">
                                        <span>Ongkos Kirim</span>
                                        <span className="font-mono font-semibold">
                                            +{formatCurrency(requisition.deliveryFee, requisition.currency)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="md:col-span-5 bg-white dark:bg-zinc-950 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm min-h-[90px]">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Grand Total Commitment</span>
                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight font-mono">
                                        {formatCurrency(requisition.grandTotal, requisition.currency)}
                                    </span>
                                    {String(requisition.currency || '').toUpperCase().includes('USD') && requisition.grandTotal > 0 && (
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <span className="text-[9px] text-slate-400 font-medium">≈</span>
                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(requisition.grandTotal * usdRate)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/10">
                                        <DollarSign size={14} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    {String(requisition.currency || '').toUpperCase().includes('USD') && (
                                        <span className="text-[8px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                                            $1 = Rp {new Intl.NumberFormat('id-ID').format(usdRate)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="px-8 py-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex justify-between items-center shrink-0">
                    <div>
                        {isMyTurn && (
                            <div className="flex items-center gap-2">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Your Decision</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        {isMyTurn && onReject && (
                            <Button type="button" variant="destructive" onClick={() => onReject(requisition)} className="font-bold uppercase tracking-wider text-xs">
                                Reject Requisition
                            </Button>
                        )}
                        {isMyTurn && onApprove && (
                            <Button type="button" onClick={() => onApprove(requisition)} className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-wider text-xs min-w-[150px]">
                                Approve & Sign
                            </Button>
                        )}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};
