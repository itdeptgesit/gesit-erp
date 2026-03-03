
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, ChevronRight, Package, Calendar, Clock, Phone, FileText } from 'lucide-react';
import { ITAsset, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';

interface LoanRequestFormInlineProps {
    currentUser: UserAccount | null;
    availableAssets: ITAsset[];
    onSuccess: () => void;
}

export const LoanRequestFormInline: React.FC<LoanRequestFormInlineProps> = ({
    currentUser, availableAssets, onSuccess
}) => {
    const [formData, setFormData] = useState({
        loanId: '',
        assetId: '',
        borrowerName: currentUser?.fullName || '',
        borrowerDept: currentUser?.department || '',
        borrowerPhone: currentUser?.phone || '',
        loanDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending',
        remarks: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');
    const [isAssetListOpen, setIsAssetListOpen] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);
    const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setFormData(prev => ({ ...prev, loanId: `LOAN-${Date.now().toString().substring(7)}` }));
        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('name').order('name');
            if (data) setDepartments(data.map(d => d.name));
        };
        fetchDepts();
    }, []);

    const filteredAssets = useMemo(() => {
        return availableAssets.filter(asset =>
            (asset.item || '').toLowerCase().includes(assetSearch.toLowerCase()) ||
            (asset.assetId || '').toLowerCase().includes(assetSearch.toLowerCase())
        );
    }, [availableAssets, assetSearch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.assetId) {
            setToast({ text: "Please select an asset from the inventory", type: 'error' });
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.from('it_asset_loans').insert([formData]);
            if (error) throw error;

            // Reset form
            setFormData({
                loanId: `LOAN-${Date.now().toString().substring(7)}`,
                assetId: '',
                borrowerName: currentUser?.fullName || '',
                borrowerDept: currentUser?.department || '',
                borrowerPhone: currentUser?.phone || '',
                loanDate: new Date().toISOString().split('T')[0],
                expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'Pending',
                remarks: ''
            });
            setAssetSearch('');
            setToast({ text: "Request submitted successfully!", type: 'success' });
            onSuccess();
        } catch (err: any) {
            setToast({ text: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const inputClass = "w-full h-10 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-slate-400 font-medium";
    const labelClass = "text-[11px] font-black text-slate-400 dark:text-slate-500 mb-1.5 block ml-1 uppercase tracking-widest";

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/20">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Package size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Request New Asset</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submit a request to IT for equipment assignment</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {toast && (
                    <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {toast.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div className="relative">
                            <label className={labelClass}>Asset Inventory</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for laptop, monitor, keyboard..."
                                    className={`${inputClass} ${formData.assetId ? 'border-primary/50 bg-primary/5' : ''}`}
                                    value={assetSearch}
                                    onChange={e => {
                                        setAssetSearch(e.target.value);
                                        setIsAssetListOpen(true);
                                    }}
                                    onFocus={() => setIsAssetListOpen(true)}
                                    autoComplete="off"
                                />
                                {isAssetListOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[50] max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
                                        {filteredAssets.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No assets available</p>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                {filteredAssets.map(asset => (
                                                    <button
                                                        key={asset.id}
                                                        type="button"
                                                        className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 last:border-0 dark:border-white/5 group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, assetId: asset.id.toString() });
                                                            setAssetSearch(asset.item);
                                                            setIsAssetListOpen(false);
                                                        }}
                                                    >
                                                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">{asset.item}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{asset.assetId} • {asset.category}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isAssetListOpen && (
                                    <div className="fixed inset-0 z-[40]" onClick={() => setIsAssetListOpen(false)} />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    <Calendar size={12} className="inline mr-1 opacity-60" /> Issue Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className={inputClass}
                                    value={formData.loanDate}
                                    onChange={e => setFormData({ ...formData, loanDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Clock size={12} className="inline mr-1 opacity-60" /> Expected Return
                                </label>
                                <input
                                    type="date"
                                    required
                                    className={inputClass}
                                    value={formData.expectedReturnDate}
                                    onChange={e => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>
                                <Phone size={12} className="inline mr-1 opacity-60" /> Your Phone
                            </label>
                            <input
                                type="text"
                                placeholder="WhatsApp number for coordination"
                                className={inputClass}
                                value={formData.borrowerPhone}
                                onChange={e => setFormData({ ...formData, borrowerPhone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                <FileText size={12} className="inline mr-1 opacity-60" /> Purpose / Remarks
                            </label>
                            <textarea
                                placeholder="Why do you need this asset? (e.g. Work travel, specialized project)"
                                className={`${inputClass} h-[100px] py-4 resize-none`}
                                value={formData.remarks}
                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower Status</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formData.borrowerName} ({formData.borrowerDept})</span>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-3"
                    >
                        {isLoading ? (
                            <RefreshCcw className="animate-spin text-white" size={16} />
                        ) : (
                            <>Submit Request <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
