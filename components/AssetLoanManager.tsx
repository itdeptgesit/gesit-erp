
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, Pencil, RefreshCcw, Trash2, Package, CheckCircle2, History,
    Download, FileSpreadsheet, ChevronLeft, ChevronRight, Clock, AlertCircle,
    XCircle, RotateCcw, User, Building2, Calendar, Phone, ArrowUpRight
} from 'lucide-react';
import { ITAssetLoan, UserAccount, ITAsset } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { StatCard } from './StatCard';
import { DangerConfirmModal } from './DangerConfirmModal';
import { LoanFormModal } from './LoanFormModal';
import { exportToExcel } from '../lib/excelExport';

interface AssetLoanManagerProps {
    currentUser: UserAccount | null;
}

export const AssetLoanManager: React.FC<AssetLoanManagerProps> = ({ currentUser }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [loans, setLoans] = useState<ITAssetLoan[]>([]);
    const [assets, setAssets] = useState<ITAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<ITAssetLoan | null>(null);
    const [deleteLoan, setDeleteLoan] = useState<ITAssetLoan | null>(null);

    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('it_asset_loans')
                .select(`
          *,
          it_assets (
            item_name,
            asset_id
          )
        `)
                .order('id', { ascending: false });

            if (error) throw error;

            if (data) {
                setLoans(data.map((item: any) => ({
                    id: item.id,
                    loanId: item.loan_id,
                    assetId: item.asset_id,
                    assetName: item.it_assets?.item_name || 'Unknown',
                    assetTag: item.it_assets?.asset_id || 'N/A',
                    borrowerName: item.borrower_name,
                    borrowerDept: item.borrower_dept,
                    borrowerPhone: item.borrower_phone,
                    loanDate: item.loan_date,
                    expectedReturnDate: item.expected_return_date,
                    actualReturnDate: item.actual_return_date,
                    status: item.status,
                    remarks: item.remarks,
                    itPersonnel: item.it_personnel
                })));
            }
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAssets = async () => {
        const { data } = await supabase
            .from('it_assets')
            .select('*')
            .eq('status', 'Idle')
            .in('category', ['IT Asset', 'Laptop', 'Other', 'Storage', 'Peripherals', 'Printer', 'Monitor']);
        if (data) {
            setAssets(data.map((item: any) => ({
                id: item.id,
                assetId: item.asset_id,
                item: item.item_name,
                category: item.category,
                status: item.status,
                location: item.location,
                company: item.company
            } as ITAsset)));
        }
    };

    useEffect(() => {
        fetchLoans();
        fetchAssets();
    }, []);

    const filteredLoans = useMemo(() => loans.filter(loan => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            loan.borrowerName.toLowerCase().includes(searchLower) ||
            loan.assetName.toLowerCase().includes(searchLower) ||
            loan.loanId.toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === 'All' ? true : loan.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [loans, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
    const paginatedLoans = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLoans.slice(start, start + itemsPerPage);
    }, [filteredLoans, currentPage]);

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'Active':
                return <span className="flex items-center gap-1.5 text-blue-500 font-bold text-[9px] uppercase"><Clock size={12} /> On Loan</span>;
            case 'Returned':
                return <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px] uppercase"><CheckCircle2 size={12} /> Returned</span>;
            case 'Overdue':
                return <span className="flex items-center gap-1.5 text-rose-500 font-bold text-[9px] uppercase"><AlertCircle size={12} /> Overdue</span>;
            default:
                return <span className="text-[9px] font-bold text-slate-400 uppercase">{status}</span>;
        }
    };

    const handleExportExcel = () => {
        if (filteredLoans.length === 0) return;

        const dataToExport = filteredLoans.map(l => ({
            "Loan ID": l.loanId,
            "Asset Name": l.assetName,
            "Asset Tag": l.assetTag,
            "Borrower": l.borrowerName,
            "Department": l.borrowerDept,
            "Phone": l.borrowerPhone || "-",
            "Loan Date": l.loanDate || "-",
            "Expected Return": l.expectedReturnDate || "-",
            "Actual Return": l.actualReturnDate || "-",
            "Status": l.status,
            "IT Personnel": l.itPersonnel,
            "Remarks": l.remarks || ""
        }));

        exportToExcel(dataToExport, `GESIT-LOANS-${new Date().toISOString().split('T')[0]}`);
    };

    const handleReturnAsset = async (loan: ITAssetLoan) => {
        try {
            const now = new Date().toISOString();
            const { error: loanError } = await supabase
                .from('it_asset_loans')
                .update({
                    status: 'Returned',
                    actual_return_date: now
                })
                .eq('id', loan.id);

            if (loanError) throw loanError;

            const { error: assetError } = await supabase
                .from('it_assets')
                .update({
                    status: 'Idle',
                    user_assigned: null,
                    department: 'IT' // Or keep current, but usually returns to IT
                })
                .eq('id', loan.assetId);

            if (assetError) throw assetError;

            await fetchLoans();
            await fetchAssets();
        } catch (err) {
            console.error('Error returning asset:', err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10 shrink-0">
                        <ArrowUpRight size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Asset <span className="text-blue-600">Loans</span></h1>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Temporary equipment borrowing</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportExcel} className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                        <FileSpreadsheet size={16} />
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Active loans" value={loans.filter(l => l.status === 'Active').length} subValue="Currently borrowed" icon={ArrowUpRight} color="blue" />
                <StatCard label="Overdue" value={loans.filter(l => l.status === 'Overdue').length} subValue="Past due date" icon={AlertCircle} color="rose" />
                <StatCard label="Returned total" value={loans.filter(l => l.status === 'Returned').length} subValue="Lifetime completions" icon={CheckCircle2} color="emerald" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                    <input type="text" placeholder="Search borrower or asset..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold dark:text-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Returned">Returned</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"
                    >
                        <RotateCcw size={16} />
                    </button>

                    {canManage && (
                        <button onClick={() => { setEditingLoan(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/10 whitespace-nowrap">
                            <Plus size={14} /> New Loan
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5">Loan Details</th>
                                <th className="px-6 py-5">Borrower</th>
                                <th className="px-6 py-5">Dates</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : paginatedLoans.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No loan records found.</td></tr>
                            ) : paginatedLoans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{loan.assetName}</span>
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase">{loan.loanId} • {loan.assetTag}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                                <User size={12} className="text-slate-400" /> {loan.borrowerName}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
                                                <Building2 size={10} /> {loan.borrowerDept}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <Calendar size={12} className="text-slate-400" /> {new Date(loan.loanDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                                                <Clock size={12} className="text-slate-400" /> Due: {new Date(loan.expectedReturnDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusDisplay(loan.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                                            {loan.status === 'Active' && (
                                                <button onClick={() => handleReturnAsset(loan)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Mark as Returned">
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}

                                            <button onClick={() => { setEditingLoan(loan); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all" title="Edit">
                                                <Pencil size={16} />
                                            </button>

                                            {isAdmin && (
                                                <button onClick={() => setDeleteLoan(loan)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-all" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Page {currentPage} of {totalPages || 1}</p>
                    <div className="flex items-center gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <LoanFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingLoan(null); }}
                onSubmit={async (formData) => {
                    try {
                        const payload = {
                            loan_id: formData.loanId || `LOAN-${Date.now().toString().substring(7)}`,
                            asset_id: formData.assetId,
                            borrower_name: formData.borrowerName,
                            borrower_dept: formData.borrowerDept,
                            borrower_phone: formData.borrowerPhone,
                            loan_date: formData.loanDate,
                            expected_return_date: formData.expectedReturnDate,
                            status: formData.status,
                            remarks: formData.remarks,
                            it_personnel: currentUser?.fullName || 'IT Support'
                        };

                        if (editingLoan) {
                            await supabase.from('it_asset_loans').update(payload).eq('id', editingLoan.id);
                            // Update asset as well even if editing
                            await supabase.from('it_assets').update({
                                status: formData.status === 'Active' ? 'Used' : 'Idle',
                                user_assigned: formData.status === 'Active' ? formData.borrowerName : null,
                                department: formData.borrowerDept
                            }).eq('id', formData.assetId);
                        } else {
                            // Mark asset as 'Used' when loaned
                            await supabase.from('it_assets').update({
                                status: 'Used',
                                user_assigned: formData.borrowerName,
                                department: formData.borrowerDept
                            }).eq('id', formData.assetId);
                            await supabase.from('it_asset_loans').insert([payload]);
                        }

                        setIsModalOpen(false);
                        setEditingLoan(null);
                        await fetchLoans();
                        await fetchAssets();
                    } catch (err) {
                        console.error('Error saving loan:', err);
                    }
                }}
                initialData={editingLoan}
                availableAssets={assets}
            />

            <DangerConfirmModal
                isOpen={!!deleteLoan}
                onClose={() => setDeleteLoan(null)}
                onConfirm={async () => {
                    if (!deleteLoan) return;
                    await supabase.from('it_asset_loans').delete().eq('id', deleteLoan.id);
                    setDeleteLoan(null);
                    await fetchLoans();
                }}
                title="Delete Record"
                message={`Remove loan record for "${deleteLoan?.assetName}"?`}
            />
        </div>
    );
};
