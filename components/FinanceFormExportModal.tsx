import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Download } from 'lucide-react';
import { PurchaseRequisition } from '../types';
import { Button } from "@/components/ui/button";
import { exportFinanceFormPDF, FinanceFormData } from '../lib/financeFormPdfExport';

interface FinanceFormExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisition: PurchaseRequisition | null;
    type: 'cash_advance' | 'payment_requisition';
}

export const FinanceFormExportModal: React.FC<FinanceFormExportModalProps> = ({
    isOpen,
    onClose,
    requisition,
    type
}) => {
    const [formData, setFormData] = useState<FinanceFormData>({
        companyName: 'GESIT ALUMAS',
        projectName: requisition?.requestedItems?.[0]?.description || requisition?.itRecommendations?.[0]?.description || '',
        cekBgNo: '',
        bankName: '',
        paymentMethod: 'Transfer',
        transferTo: requisition?.bankAccount || '',
        amount: requisition?.grandTotal || 0,
    });

    if (!isOpen || !requisition) return null;

    const title = type === 'cash_advance' ? 'Export Cash Advance' : 'Export Payment Requisition';

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await exportFinanceFormPDF(requisition, type, formData);
            onClose();
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Failed to generate PDF. Check console for details.");
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800 dark:text-zinc-100">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleExport} className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Please fill in the additional details for the form before generating the PDF.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Company</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.companyName}
                                onChange={e => setFormData({...formData, companyName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Project Name</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.projectName}
                                onChange={e => setFormData({...formData, projectName: e.target.value})}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Bank</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.bankName}
                                onChange={e => setFormData({...formData, bankName: e.target.value})}
                                placeholder="BCA, Mandiri, etc."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Cek / BG No.</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.cekBgNo}
                                onChange={e => setFormData({...formData, cekBgNo: e.target.value})}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase block mb-1">Payment Method</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentMethod" 
                                    checked={formData.paymentMethod === 'Cash'}
                                    onChange={() => setFormData({...formData, paymentMethod: 'Cash'})}
                                    className="accent-blue-600"
                                />
                                Cash
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentMethod" 
                                    checked={formData.paymentMethod === 'Transfer'}
                                    onChange={() => setFormData({...formData, paymentMethod: 'Transfer'})}
                                    className="accent-blue-600"
                                />
                                Transfer
                            </label>
                        </div>
                    </div>

                    {formData.paymentMethod === 'Transfer' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Transfer To</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.transferTo}
                                onChange={e => setFormData({...formData, transferTo: e.target.value})}
                                placeholder="Account Name / Number"
                            />
                        </div>
                    )}

                    <div className="space-y-1 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Amount (Rp)</label>
                        <input 
                            type="number"
                            className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 font-mono"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                        />
                        {type === 'cash_advance' && (
                            <p className="text-[10px] text-slate-400">You can override the amount for Cash Advance if needed.</p>
                        )}
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2">
                            <Download size={16} />
                            Generate PDF
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
