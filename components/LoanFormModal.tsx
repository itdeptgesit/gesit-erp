
import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCcw, ChevronRight } from 'lucide-react';
import { ITAssetLoan, ITAsset, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';

interface LoanFormModalProps {
    isOpen: boolean;
    currentUser: UserAccount | null;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<void>;
    initialData?: ITAssetLoan | null;
    availableAssets: ITAsset[];
}

export const LoanFormModal: React.FC<LoanFormModalProps> = ({
    isOpen, currentUser, onClose, onSubmit, initialData, availableAssets
}) => {
    const isStaff = currentUser?.role === 'Staff' || currentUser?.role === 'Admin';
    const initialStatus = isStaff ? 'Active' : 'Pending';

    const [formData, setFormData] = useState({
        loanId: '',
        assetId: '',
        borrowerName: currentUser?.fullName || '',
        borrowerDept: currentUser?.department || '',
        borrowerPhone: currentUser?.phone || '',
        loanDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: initialStatus,
        remarks: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');
    const [isAssetListOpen, setIsAssetListOpen] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);

    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('name').order('name');
            if (data) setDepartments(data.map(d => d.name));
        };
        if (isOpen) fetchDepts();
    }, [isOpen]);

    const filteredAssets = useMemo(() => {
        return availableAssets.filter(asset =>
            (asset.item || '').toLowerCase().includes(assetSearch.toLowerCase()) ||
            (asset.assetId || '').toLowerCase().includes(assetSearch.toLowerCase())
        );
    }, [availableAssets, assetSearch]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                loanId: initialData.loanId,
                assetId: initialData.assetId?.toString() || '',
                borrowerName: initialData.borrowerName,
                borrowerDept: initialData.borrowerDept,
                borrowerPhone: initialData.borrowerPhone || '',
                loanDate: initialData.loanDate.split('T')[0],
                expectedReturnDate: initialData.expectedReturnDate.split('T')[0],
                status: initialData.status,
                remarks: initialData.remarks || ''
            });
            const asset = availableAssets.find(a => a.id.toString() === initialData.assetId?.toString());
            if (asset) setAssetSearch(asset.item);
            else if (initialData.assetName) setAssetSearch(initialData.assetName);
        } else {
            setFormData({
                loanId: `LOAN-${Date.now().toString().substring(7)}`,
                assetId: '',
                borrowerName: currentUser?.fullName || '',
                borrowerDept: currentUser?.department || '',
                borrowerPhone: currentUser?.phone || '',
                loanDate: new Date().toISOString().split('T')[0],
                expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: initialStatus,
                remarks: ''
            });
            setAssetSearch('');
        }
    }, [initialData, isOpen, availableAssets, currentUser, initialStatus]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none placeholder:text-slate-400 font-medium";
    const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block ml-0.5 uppercase tracking-wider";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[95vh] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {initialData ? (isStaff && initialData.status === 'Pending' ? 'Approve Loan Request' : 'Edit Loan Record') : (isStaff ? 'New IT Asset Loan' : 'Request Asset Loan')}
                        </h2>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-[0.15em]">
                            {initialData?.status === 'Pending' ? 'Incoming Request' : `Ref: ${formData.loanId}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-8">
                            <div className="relative">
                                <div className="flex justify-between items-center mb-2.5">
                                    <label className={labelClass}>Asset Inventory</label>
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                        {availableAssets.length} Available
                                    </span>
                                </div>
                                <div className="space-y-2 relative">
                                    <div className="relative group/search">
                                        <input
                                            type="text"
                                            required={isStaff}
                                            placeholder={isStaff ? "Search by name or serial..." : "Search for asset you want to request..."}
                                            className={`${inputClass} ${formData.assetId ? 'border-blue-500/50 bg-blue-50/10' : ''}`}
                                            value={assetSearch}
                                            onChange={e => {
                                                setAssetSearch(e.target.value);
                                                setIsAssetListOpen(true);
                                            }}
                                            onFocus={() => setIsAssetListOpen(true)}
                                            autoComplete="off"
                                        />

                                        {isAssetListOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-lg z-[110] max-h-[260px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {filteredAssets.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <div className="text-xs text-slate-400 font-medium">No matching assets found</div>
                                                    </div>
                                                ) : (
                                                    <div className="py-1">
                                                        {filteredAssets.map(asset => (
                                                            <button
                                                                key={asset.id}
                                                                type="button"
                                                                className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group/item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData({ ...formData, assetId: asset.id.toString() });
                                                                    setAssetSearch(asset.item);
                                                                    setIsAssetListOpen(false);
                                                                }}
                                                            >
                                                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{asset.item}</div>
                                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{asset.assetId} • {asset.category}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isAssetListOpen && (
                                        <div className="fixed inset-0 z-[105]" onClick={() => setIsAssetListOpen(false)} />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className={labelClass}>Recipient Information</label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        required
                                        disabled={!isStaff}
                                        placeholder="Borrower Name"
                                        className={`${inputClass} ${!isStaff ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`}
                                        value={formData.borrowerName}
                                        onChange={e => setFormData({ ...formData, borrowerName: e.target.value })}
                                    />
                                    <div className="relative">
                                        <select
                                            required
                                            disabled={!isStaff}
                                            className={`${inputClass} appearance-none cursor-pointer pr-10 ${!isStaff ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`}
                                            value={formData.borrowerDept}
                                            onChange={e => setFormData({ ...formData, borrowerDept: e.target.value })}
                                        >
                                            <option value="" disabled>Select Department</option>
                                            {/* ensure currentUser department is always an option even if not in official list yet */}
                                            {currentUser?.department && !departments.includes(currentUser.department) && (
                                                <option value={currentUser.department}>{currentUser.department}</option>
                                            )}
                                            {departments.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronRight size={14} className="rotate-90 opacity-50" />
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Phone Number (Optional)"
                                        className={inputClass}
                                        value={formData.borrowerPhone}
                                        onChange={e => setFormData({ ...formData, borrowerPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-6">
                                <label className={labelClass}>Contractual Dates</label>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tight ml-0.5 mb-1">Issue Date</div>
                                        <input
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.loanDate}
                                            onChange={e => setFormData({ ...formData, loanDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tight ml-0.5 mb-1">Expected Return</div>
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

                            <div>
                                <label className={labelClass}>Loan Status</label>
                                <div className="relative">
                                    <select
                                        disabled={!isStaff}
                                        className={`${inputClass} appearance-none cursor-pointer pr-10 ${!isStaff ? 'bg-slate-100 opacity-70 cursor-not-allowed' : ''}`}
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {!isStaff && <option value="Pending">Request Pending</option>}
                                        <option value="Active">Operational (On Loan)</option>
                                        <option value="Pending">Waiting for Approval</option>
                                        <option value="Returned">Returned to Inventory</option>
                                        <option value="Overdue">Overdue / Delayed</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronRight size={16} className="rotate-90 opacity-50" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-6">
                        <label className={labelClass}>Internal Notes</label>
                        <textarea
                            placeholder="Conditions or maintenance required..."
                            className={`${inputClass} min-h-[100px] py-2.5 px-3 resize-none leading-relaxed border-slate-200/80 dark:border-slate-700/80`}
                            value={formData.remarks}
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                        />
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/10 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
                        >
                            {isLoading ? (
                                <RefreshCcw className="animate-spin" size={14} />
                            ) : (
                                <>
                                    <span>{initialData ? (isStaff && initialData.status === 'Pending' ? 'Approve' : 'Save Changes') : (isStaff ? 'Create' : 'Request')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
