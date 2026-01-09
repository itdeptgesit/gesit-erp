'use client';

import React from 'react';
import { 
    X, Calendar, ShieldCheck, FileText, 
    Receipt, Fingerprint, Download, 
    Building2, User, CheckCircle2, XCircle, Clock, ShieldAlert, Award, Briefcase
} from 'lucide-react';
import { PurchasePlan, UserAccount } from '../types';

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PurchasePlan | null;
  spvName?: string;
  managerName?: string;
  requesterProfile?: UserAccount | null;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({ isOpen, onClose, plan, spvName, managerName, requesterProfile }) => {
  if (!isOpen || !plan) return null;

  const formatFullIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
    }).format(num);
  };

  const getStatusConfig = (status: string) => {
    if (status === 'Approved') return { 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        icon: <CheckCircle2 size={16} />
    };
    if (status === 'Rejected') return { 
        color: 'text-rose-600', 
        bg: 'bg-rose-50', 
        border: 'border-rose-200',
        icon: <XCircle size={16} />
    };
    return { 
        color: 'text-amber-600', 
        bg: 'bg-amber-50', 
        border: 'border-amber-200',
        icon: <Clock size={16} />
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const statusCfg = getStatusConfig(plan.status);
  const isFinal = plan.status === 'Approved' || plan.status === 'Rejected';

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
            #printable-doc, #printable-doc * { visibility: visible; }
            #printable-doc { 
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

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Modal UI Header (Hidden in Print) */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 no-print">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Request Details</h2>
                    <p className="text-xs text-slate-500 font-medium">Reference code: PR-{plan.id}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                <X size={20} />
            </button>
        </div>

        {/* Document Body */}
        <div id="printable-doc" className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
            
            {/* Document Header - Branding */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                <div className="flex items-center gap-4">
                    <img src="https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png" className="h-12 w-auto" alt="Logo" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Procurement Request</h1>
                        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Gesit ERP Enterprise Management</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request number</p>
                    <p className="text-xl font-mono font-black text-slate-900 leading-none">#{plan.id.toString().padStart(5, '0')}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2 italic uppercase">Date: {plan.requestDate}</p>
                </div>
            </div>

            {/* Requester Profile Section */}
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                        <User size={12} className="text-blue-500" /> Originator Information
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{plan.requester}</p>
                        {requesterProfile ? (
                          <>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                                <Award size={10} /> {requesterProfile.jobTitle || 'Team Member'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                <Briefcase size={10} /> {requesterProfile.department}
                            </p>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-widest pt-1">
                                <Building2 size={10} /> {requesterProfile.company || 'Corporate Entity'}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500 font-medium">Authorized Corporate Account</p>
                        )}
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" /> Status Decision
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                        {statusCfg.icon}
                        {plan.status}
                    </div>
                </div>
            </div>

            {/* Specifications Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Technical specs & Requirements</h3>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 print-bg-gray print-border">
                    <p className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight">{plan.item}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {plan.specs}
                    </p>
                </div>
            </div>

            {/* Justification Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Strategic Justification</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed px-2">
                    "{plan.justification}"
                </p>
            </div>

            {/* Financial Calculations Table */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Financial Breakdown</h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 print-bg-gray">
                            <tr className="text-[10px] font-black text-slate-500 uppercase">
                                <th className="px-6 py-4">Unit Description</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4 text-right">Unit Value</th>
                                <th className="px-6 py-4 text-right">Commitment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr>
                                <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{plan.item}</td>
                                <td className="px-6 py-5 text-center font-bold text-slate-600 dark:text-slate-400">{plan.quantity}x</td>
                                <td className="px-6 py-5 text-right font-mono font-medium">{formatFullIDR(plan.unitPrice)}</td>
                                <td className="px-6 py-5 text-right font-mono font-black text-blue-600 dark:text-blue-400">{formatFullIDR(plan.totalPrice)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-900 text-white print-bg-gray print:text-black">
                            <tr className="font-bold">
                                <td colSpan={3} className="px-6 py-5 text-right text-[10px] uppercase tracking-widest opacity-70">Total Net Investment</td>
                                <td className="px-6 py-5 text-right font-mono text-lg">{formatFullIDR(plan.totalPrice)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Approval Flow Visualization */}
            <div className="space-y-6 pt-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Approval Authorization Matrix</h3>
                <div className="flex items-center justify-between gap-2 px-4 py-8 bg-slate-50 dark:bg-slate-800/20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 print-bg-gray print-border">
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg"><User size={18} /></div>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Request Initiated</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate max-w-[100px]">{plan.requester}</p>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1 mb-6 border-dashed border-t"></div>
                    
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center border border-slate-300"><Building2 size={18} /></div>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Management Review</p>
                        <p className="text-[9px] text-slate-400 font-medium italic truncate max-w-[120px]">{managerName || spvName || 'Verified Official'}</p>
                    </div>
                    
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1 mb-6 border-dashed border-t"></div>
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900 ${plan.status === 'Approved' ? 'bg-emerald-500 text-white' : plan.status === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                            {plan.status === 'Approved' ? <CheckCircle2 size={24} /> : plan.status === 'Rejected' ? <XCircle size={24} /> : <Clock size={24} />}
                        </div>
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{plan.status}</p>
                        <p className="text-[9px] text-slate-400 font-medium italic">Decision Authority</p>
                    </div>
                </div>
            </div>

            {/* Document Footer / Signatures Area */}
            <div className="pt-20 border-t border-slate-100 grid grid-cols-3 gap-10">
                <div className="space-y-12">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By (SPV)</p>
                    <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900">{spvName || '................................'}</p>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">Supervisor Unit</p>
                    </div>
                </div>
                <div className="space-y-12">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized By (Mgr)</p>
                    <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900">{managerName || '................................'}</p>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">Managerial Node</p>
                    </div>
                </div>
                <div className="text-right flex flex-col justify-end space-y-2">
                    <div className="inline-block p-2 border border-slate-200 rounded-lg bg-slate-50 mb-2">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Digital Auth Code</p>
                        <p className="text-[8px] font-mono text-slate-400">HASH_{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                        ID: PR-{plan.id} <br/>
                        Generated: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        </div>

        {/* Modal Actions (Hidden in Print) */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3 no-print shrink-0">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 font-bold text-xs hover:text-slate-800 transition-all"
            >
                Close View
            </button>
            
            {isFinal && (
                <button 
                    onClick={handlePrint}
                    className={`px-8 py-2.5 ${plan.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-black'} text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95`}
                >
                    <Download size={16} /> Save Official PDF
                </button>
            )}
        </div>
      </div>
    </div>
  );
};