
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
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoanRequestFormInline } from './LoanRequestFormInline';

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
    const [selectedLoan, setSelectedLoan] = useState<ITAssetLoan | null>(null);

    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('it_asset_loans')
                .select(`
          *,
          it_assets (
            item_name,
            asset_id
          )
        `)
                .order('id', { ascending: false });

            // If not admin/staff, only show own requests
            if (!canManage && currentUser) {
                query = query.eq('borrower_name', currentUser.fullName);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setLoans(data.map((item: any) => ({
                    id: item.id,
                    loanId: item.loan_id,
                    assetId: item.asset_id,
                    assetName: item.it_assets?.item_name || 'Requested Asset',
                    assetTag: item.it_assets?.asset_id || 'PENDING',
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
            case 'Pending':
                return <span className="flex items-center gap-1.5 text-amber-500 font-bold text-[9px] uppercase"><Clock size={12} /> Pending Approval</span>;
            case 'Active':
                return <span className="flex items-center gap-1.5 text-blue-500 font-bold text-[9px] uppercase"><Clock size={12} /> On Loan</span>;
            case 'Returned':
                return <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px] uppercase"><CheckCircle2 size={12} /> Returned</span>;
            case 'Overdue':
                return <span className="flex items-center gap-1.5 text-rose-500 font-bold text-[9px] uppercase"><AlertCircle size={12} /> Overdue</span>;
            case 'Rejected':
                return <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase"><XCircle size={12} /> {canManage ? 'Rejected' : 'Request Rejected'}</span>;
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

            if (loan.assetId) {
                const { error: assetError } = await supabase
                    .from('it_assets')
                    .update({
                        status: 'Idle',
                        user_assigned: null,
                    })
                    .eq('id', loan.assetId);

                if (assetError) throw assetError;
            }

            await fetchLoans();
            await fetchAssets();
        } catch (err) {
            console.error('Error returning asset:', err);
        }
    };

    const handleApproveRequest = async (loan: ITAssetLoan) => {
        setEditingLoan(loan);
        setIsModalOpen(true);
    };

    const handleRejectRequest = async (loan: ITAssetLoan) => {
        try {
            const { error } = await supabase
                .from('it_asset_loans')
                .update({ status: 'Rejected', it_personnel: currentUser?.fullName || 'IT Support' })
                .eq('id', loan.id);
            if (error) throw error;
            await fetchLoans();
        } catch (err) {
            console.error('Error rejecting loan:', err);
        }
    };

    return (
        <div className="pb-12 space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Asset Loan"
                description={canManage ? "Manage and track company assets distribution" : "Request equipment for your work needs"}
            >
                <div className="flex items-center gap-3">
                    {canManage && (
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            className="h-9 px-4 text-xs font-bold"
                        >
                            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Export Excel
                        </Button>
                    )}
                    {canManage && (
                        <Button onClick={() => { setEditingLoan(null); setIsModalOpen(true); }} className="flex items-center gap-2">
                            <Plus size={16} /> New Record
                        </Button>
                    )}
                </div>
            </PageHeader>

            {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending Requests"
                        value={loans.filter(l => l.status === 'Pending').length}
                        subValue="Needs approval"
                        icon={Clock}
                        color="amber"
                    />
                    <StatCard label="Active loans" value={loans.filter(l => l.status === 'Active').length} subValue="Currently borrowed" icon={ArrowUpRight} color="blue" />
                    <StatCard label="Overdue" value={loans.filter(l => l.status === 'Overdue').length} subValue="Past due date" icon={AlertCircle} color="rose" />
                    <StatCard label="Returned total" value={loans.filter(l => l.status === 'Returned').length} subValue="Lifetime completions" icon={CheckCircle2} color="emerald" />
                </div>
            )}

            {/* Filters Section - Only show for canManage or if we want users to filter history */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search assets or borrowers..."
                            className="w-full h-9 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Pending">Pending Approval</option>
                        <option value="Active">Active</option>
                        <option value="Returned">Returned</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <button onClick={fetchLoans} className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors">
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className={`${canManage ? 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col' : ''}`}>
                {canManage ? (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Item Details</th>
                                    <th className="px-6 py-4">Borrower</th>
                                    <th className="px-6 py-4 text-center">Dates</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
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
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                    <Calendar size={12} className="text-slate-400" /> {new Date(loan.loanDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                                                    <Clock size={12} className="text-slate-400" /> Due: {new Date(loan.expectedReturnDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusDisplay(loan.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                                                {loan.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleApproveRequest(loan)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve & Assign">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleRejectRequest(loan)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Reject Request">
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}

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
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                        {/* LEFT COLUMN: THE FORM */}
                        <div className="lg:col-span-8">
                            <LoanRequestFormInline
                                currentUser={currentUser}
                                availableAssets={assets}
                                onSuccess={fetchLoans}
                            />
                        </div>

                        {/* RIGHT COLUMN: COMPACT HISTORY */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">My Requests History</h3>
                                <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-400 font-bold">{filteredLoans.length}</Badge>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                                {isLoading ? (
                                    <div className="py-20 text-center"><RefreshCcw className="animate-spin text-primary/30 mx-auto" size={24} /></div>
                                ) : filteredLoans.length === 0 ? (
                                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5">
                                        <Package size={32} className="mx-auto text-slate-100 dark:text-slate-800 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No history found</p>
                                    </div>
                                ) : filteredLoans.map((loan) => (
                                    <div
                                        key={loan.id}
                                        onClick={() => setSelectedLoan(loan)}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]"
                                    >
                                        {/* Status indicator bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${loan.status === 'Active' ? 'bg-emerald-500' : loan.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />

                                        <div className="flex justify-between items-start mb-2 pl-1">
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight group-hover:text-primary transition-colors">{loan.assetName}</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{loan.assetTag || loan.loanId}</span>
                                            </div>
                                            {getStatusDisplay(loan.status)}
                                        </div>

                                        <div className="flex items-center gap-4 mt-3 pl-1">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500">{new Date(loan.loanDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-auto">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">IT:</span>
                                                <span className="text-[10px] font-bold text-blue-500">{loan.itPersonnel ? loan.itPersonnel.split(' ')[0] : '...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

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
                currentUser={currentUser}
                onClose={() => { setIsModalOpen(false); setEditingLoan(null); }}
                onSubmit={async (formData) => {
                    try {
                        const payload = {
                            loan_id: formData.loanId || `LOAN-${Date.now().toString().substring(7)}`,
                            asset_id: formData.assetId || null,
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
                            if (formData.assetId) {
                                await supabase.from('it_assets').update({
                                    status: formData.status === 'Active' ? 'Used' : 'Idle',
                                    user_assigned: formData.status === 'Active' ? formData.borrowerName : null,
                                    department: formData.borrowerDept
                                }).eq('id', formData.assetId);
                            }
                        } else {
                            // If user is requesting, status is Pending
                            // If admin is creating, status is Active (usually)
                            if (formData.assetId && formData.status === 'Active') {
                                await supabase.from('it_assets').update({
                                    status: 'Used',
                                    user_assigned: formData.borrowerName,
                                    department: formData.borrowerDept
                                }).eq('id', formData.assetId);
                            }
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

            {/* LOAN RECEIPT / INVOICE MODAL */}
            {selectedLoan && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedLoan(null)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

                        {/* Top bar */}
                        <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Loan Receipt</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedLoan.loanId}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLoan(null)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"><XCircle size={24} /></button>
                        </div>

                        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                            {/* Receipt Body */}
                            <div className="grid grid-cols-2 gap-12">
                                {/* Left Section: Asset Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">Item Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Asset Name</p>
                                                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{selectedLoan.assetName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Asset Tag / ID</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider">{selectedLoan.assetTag || 'Pending Assignment'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">Terms</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loan Date</span>
                                                </div>
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{new Date(selectedLoan.loanDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</span>
                                                </div>
                                                <span className={`text-[11px] font-black uppercase ${selectedLoan.status === 'Overdue' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{new Date(selectedLoan.expectedReturnDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Borrower Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Borrower info</h4>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{selectedLoan.borrowerName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLoan.borrowerDept}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} className="text-slate-400" />
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{selectedLoan.borrowerPhone || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">current Status</h4>
                                        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                            {getStatusDisplay(selectedLoan.status)}
                                            {selectedLoan.status === 'Returned' && selectedLoan.actualReturnDate && (
                                                <p className="text-[9px] font-bold text-slate-400">{new Date(selectedLoan.actualReturnDate).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedLoan.remarks && (
                                <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-dashed border-amber-200 dark:border-amber-900/30 rounded-3xl">
                                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-2">Remarks / Notes</h4>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">{selectedLoan.remarks}</p>
                                </div>
                            )}

                            {/* Signatures placeholder */}
                            <div className="grid grid-cols-2 gap-20 pt-10 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="text-center space-y-12">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requester / Borrower</p>
                                    <div className="w-full border-b border-slate-200 dark:border-slate-800"></div>
                                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{selectedLoan.borrowerName.toUpperCase()}</p>
                                </div>
                                <div className="text-center space-y-12">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IT Personnel / Dispatched By</p>
                                    <div className="w-full border-b border-slate-200 dark:border-slate-800"></div>
                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{(selectedLoan.itPersonnel || 'IT SUPPORT').toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
                            <button onClick={() => window.print()} className="px-8 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
                                <Download size={16} /> Save as PDF
                            </button>
                            <button onClick={() => setSelectedLoan(null)} className="px-10 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20">Close Receipt</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
