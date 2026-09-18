import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { PurchaseRequisition } from '../types';
import { Button } from "@/components/ui/button";
import { exportFinanceFormPDF, FinanceFormData } from '../lib/financeFormPdfExport';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';

interface FinanceFormExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisition: PurchaseRequisition | null;
    type: 'cash_advance' | 'payment_requisition';
}

const getAbbreviation = (name: string): string => {
    return name.split(/\s+/).map(w => w[0]).join('').toUpperCase();
};

const formatNumber = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
};

const parseNumber = (val: string) => {
    return parseInt(val.replace(/\D/g, ''), 10) || 0;
};

export const FinanceFormExportModal: React.FC<FinanceFormExportModalProps> = ({
    isOpen,
    onClose,
    requisition,
    type
}) => {
    const { showToast } = useToast();
    const DEFAULT_COMPANY = 'GESIT ALUMAS';
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<FinanceFormData>({
        companyName: DEFAULT_COMPANY,
        costCenter: getAbbreviation(DEFAULT_COMPANY),
        projectName: '',
        cekBgNo: '',
        bankName: '',
        paymentMethod: 'Transfer',
        transferTo: '',
        paidTo: '',
        requestDate: '',
        amount: 0,
        paperSize: 'a4_half',
    });

    useEffect(() => {
        supabase.from('companies').select('id, name').order('name').then(({ data }) => {
            if (data && data.length > 0) {
                setCompanies(data);
            }
        });
    }, []);

    useEffect(() => {
        if (isOpen && requisition) {
            const initialCompany = requisition.company || DEFAULT_COMPANY;
            const defaultProjectName =
                requisition.requestedItems?.map(i => i.description).filter(Boolean).join(', ') ||
                requisition.itRecommendations?.[0]?.description ||
                '';

            setFormData({
                companyName: initialCompany,
                costCenter: getAbbreviation(initialCompany),
                projectName: defaultProjectName,
                cekBgNo: '',
                bankName: '',
                paymentMethod: 'Transfer',
                transferTo: requisition.bankAccount || '',
                paidTo: requisition.paidTo || requisition.requesterFullname || 'Finance & Accounting',
                requestDate: requisition.requestDate || new Date().toISOString().split('T')[0],
                amount: requisition.grandTotal || 0,
                paperSize: 'a4_half',
            });
        }
    }, [isOpen, requisition]);

    if (!isOpen || !requisition) return null;

    const isCashAdvance = type === 'cash_advance';
    const title = isCashAdvance ? 'Export Cash Advance' : 'Export Payment Requisition';

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await exportFinanceFormPDF(requisition, type, formData);
            showToast(`${isCashAdvance ? 'Cash Advance' : 'Payment Requisition'} PDF berhasil diunduh!`, 'success');
            onClose();
        } catch (error: any) {
            console.error("Failed to generate PDF:", error);
            showToast("Gagal mengunduh PDF: " + (error?.message || "Unknown error"), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-zinc-100">{title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Format Ukuran A5 / A4 Bagi 2
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleExport} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Lengkapi rincian formulir voucher sebelum mengunduh PDF.
                    </p>

                    {/* Paper Size Selector */}
                    <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-700/80">
                        <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase block">
                            Ukuran Kertas & Format Cetak
                        </label>
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paperSize: 'a4_half' })}
                                className={`p-2.5 text-left rounded-lg border transition-all ${
                                    formData.paperSize === 'a4_half'
                                        ? 'border-blue-600 bg-white dark:bg-zinc-800 shadow-sm ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 hover:bg-white text-slate-600 dark:text-zinc-400'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs">A4 Bagi 2</span>
                                    {formData.paperSize === 'a4_half' && (
                                        <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                                    A4 Landscape + garis potong (✂) di tengah
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paperSize: 'a5' })}
                                className={`p-2.5 text-left rounded-lg border transition-all ${
                                    formData.paperSize === 'a5'
                                        ? 'border-blue-600 bg-white dark:bg-zinc-800 shadow-sm ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 hover:bg-white text-slate-600 dark:text-zinc-400'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs">A5 Pas</span>
                                    {formData.paperSize === 'a5' && (
                                        <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                                    Format 1 lembar utuh A5 (148.5 x 210 mm)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paperSize: 'a4_duplicate' })}
                                className={`p-2.5 text-left rounded-lg border transition-all ${
                                    formData.paperSize === 'a4_duplicate'
                                        ? 'border-blue-600 bg-white dark:bg-zinc-800 shadow-sm ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 hover:bg-white text-slate-600 dark:text-zinc-400'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs">A4 2-Rangkap</span>
                                    {formData.paperSize === 'a4_duplicate' && (
                                        <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                                    2 Voucher kembar (Asli & Arsip)
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Company & Cost Center */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Company</label>
                            <select
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 font-medium"
                                value={formData.companyName}
                                onChange={e => setFormData({
                                    ...formData,
                                    companyName: e.target.value,
                                    costCenter: getAbbreviation(e.target.value)
                                })}
                            >
                                {companies.length === 0 && (
                                    <option value="GESIT ALUMAS">GESIT ALUMAS</option>
                                )}
                                {companies.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Cost Center</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 font-bold"
                                value={formData.costCenter}
                                onChange={e => setFormData({ ...formData, costCenter: e.target.value })}
                                placeholder="Contoh: GA, GP, IT"
                            />
                        </div>
                    </div>

                    {/* Project Name & Cek/BG No. */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Project Name</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.projectName}
                                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                placeholder="Nama proyek / deskripsi item"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Cek / BG No.</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.cekBgNo}
                                onChange={e => setFormData({ ...formData, cekBgNo: e.target.value })}
                                placeholder="Nomor Cek / Giro (Opsional)"
                            />
                        </div>
                    </div>

                    {/* Bank & Request Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Bank</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.bankName}
                                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                placeholder="Contoh: BCA, Mandiri"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Request Date</label>
                            <input 
                                type="date"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                                value={formData.requestDate}
                                onChange={e => setFormData({ ...formData, requestDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Pay to */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Pay to</label>
                        <input 
                            type="text"
                            className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50"
                            value={formData.paidTo}
                            onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
                            placeholder="Nama penerima / Vendor / Finance & Accounting"
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase block mb-1">Metode Pembayaran</label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                <input 
                                    type="radio" 
                                    name="paymentMethod" 
                                    checked={formData.paymentMethod === 'Cash'}
                                    onChange={() => setFormData({ ...formData, paymentMethod: 'Cash' })}
                                    className="accent-blue-600"
                                />
                                Cash
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                <input 
                                    type="radio" 
                                    name="paymentMethod" 
                                    checked={formData.paymentMethod === 'Transfer'}
                                    onChange={() => setFormData({ ...formData, paymentMethod: 'Transfer' })}
                                    className="accent-blue-600"
                                />
                                Transfer
                            </label>
                        </div>
                    </div>

                    {formData.paymentMethod === 'Transfer' && (
                        <div className="space-y-1 animate-in fade-in">
                            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Transfer To (Rekening Tujuan)</label>
                            <input 
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 font-mono"
                                value={formData.transferTo}
                                onChange={e => setFormData({ ...formData, transferTo: e.target.value })}
                                placeholder="Contoh: BCA 123456789 a.n PT ABC"
                            />
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase">Nominal / Amount (Rp)</label>
                        <input 
                            type="text"
                            className="w-full text-sm p-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800/50 font-mono font-bold"
                            value={formatNumber(formData.amount)}
                            onChange={e => setFormData({ ...formData, amount: parseNumber(e.target.value) })}
                            placeholder="0"
                        />
                        {isCashAdvance && (
                            <p className="text-[10px] text-slate-400">Nominal Cash Advance dapat disesuaikan jika berbeda dari total PR.</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Unduh PDF
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
