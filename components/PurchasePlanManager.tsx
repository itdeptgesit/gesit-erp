'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, RefreshCcw, Check, X,
    Trash2, Wallet,
    Clock, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight,
    ListFilter, BarChart3, UserCheck, ShieldCheck, Zap, Fingerprint, Eye
} from 'lucide-react';
import { PurchasePlan, UserAccount } from '../types';
import { PurchaseRequestModal } from './PurchaseRequestModal';
import { PurchaseDetailModal } from './PurchaseDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { RejectReasonModal } from './RejectReasonModal';
import { supabase } from '../lib/supabaseClient';
import { StatCard } from './StatCard';

interface PurchasePlanManagerProps {
    currentUser: UserAccount | null;
}

type ProcurementTab = 'registry' | 'approvals' | 'analytics';

export const PurchasePlanManager: React.FC<PurchasePlanManagerProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<ProcurementTab>('registry');
    const [plans, setPlans] = useState<PurchasePlan[]>([]);
    const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [selectedPlan, setSelectedPlan] = useState<PurchasePlan | null>(null);
    const [selectedRequesterProfile, setSelectedRequesterProfile] = useState<UserAccount | null>(null);
    const [approverNames, setApproverNames] = useState({ spv: '', manager: '' });
    const [rejectTarget, setRejectTarget] = useState<PurchasePlan | null>(null);
    const [deletePlan, setDeletePlan] = useState<PurchasePlan | null>(null);

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const normalize = (val: string) => (val || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: userData } = await supabase.from('user_accounts').select('*');
            if (userData) {
                setAllUsers(userData.map((u: any) => ({
                    id: u.id, email: u.email, fullName: u.full_name, role: u.role, company: u.company, jobTitle: u.job_title,
                    supervisorId: u.supervisor_id?.toString(), managerId: u.manager_id?.toString(), department: u.department,
                    status: u.status, username: u.username, groups: u.groups || []
                })));
            }
            const { data: planData, error } = await supabase.from('purchase_plans').select('*').order('id', { ascending: false });
            if (error) throw error;
            if (planData) {
                setPlans(planData.map(p => ({
                    id: p.id, item: p.item, specs: p.specs, quantity: p.quantity, unitPrice: p.unit_price,
                    totalPrice: p.total_price, vendor: p.vendor, status: p.status, requester: p.requester,
                    requestDate: p.request_date, justification: p.justification
                })));
            }
        } catch (err: any) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const getRequesterProfile = (requesterString: string) => {
        if (!allUsers.length) return null;
        const normalizedReq = normalize(requesterString);
        let profile = allUsers.find(u => normalize(u.username) === normalizedReq);
        if (profile) return profile;
        profile = allUsers.find(u => normalize(u.fullName) === normalizedReq);
        return profile || null;
    };

    const isMyTurnToApprove = (plan: PurchasePlan) => {
        if (!currentUser || !allUsers.length) return false;
        if (plan.status === 'Approved' || plan.status === 'Rejected') return false;
        const currentUserIdStr = currentUser.id?.toString();
        if (plan.status === 'Pending Approval') return isAdmin;
        const requesterProfile = getRequesterProfile(plan.requester);
        if (!requesterProfile) return false;
        if (plan.status === 'Pending Supervisor') return requesterProfile.supervisorId === currentUserIdStr;
        if (plan.status === 'Pending Manager') return requesterProfile.managerId === currentUserIdStr;
        return false;
    };

    const stats = useMemo(() => {
        const approved = plans.filter(p => p.status === 'Approved');
        const totalSpend = approved.reduce((sum, p) => sum + p.totalPrice, 0);
        const pendingCount = plans.filter(p => p.status.includes('Pending')).length;
        const actionsCount = plans.filter(isMyTurnToApprove).length;
        return { totalSpend, pendingCount, approvedCount: approved.length, actionsCount };
    }, [plans, allUsers, currentUser]);

    const filteredPlans = useMemo(() => {
        const list = activeTab === 'approvals' ? plans.filter(isMyTurnToApprove) : plans;
        return list.filter(p => p.item.toLowerCase().includes(searchTerm.toLowerCase()) || p.requester.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [plans, allUsers, searchTerm, activeTab, currentUser]);

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPlans.slice(start, start + itemsPerPage);
    }, [filteredPlans, currentPage]);

    const handleApprove = async (plan: PurchasePlan) => {
        setIsActionLoading(true);
        try {
            const requesterProfile = getRequesterProfile(plan.requester);
            let nextStatus = 'Approved';
            if (plan.status === 'Pending Supervisor') nextStatus = (requesterProfile && requesterProfile.managerId) ? 'Pending Manager' : 'Approved';
            else if (plan.status === 'Pending Manager' || plan.status === 'Pending Approval') nextStatus = 'Approved';
            const { error } = await supabase.from('purchase_plans').update({ status: nextStatus }).eq('id', plan.id);
            if (error) throw error;
            await fetchData();
        } catch (err: any) { alert("Authorization failed: " + err.message); } finally { setIsActionLoading(false); }
    };

    const submitReject = async (reason: string) => {
        if (!rejectTarget) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('purchase_plans').update({ status: 'Rejected', justification: `${rejectTarget.justification}\n\n[DENIED]: ${reason}` }).eq('id', rejectTarget.id);
            if (error) throw error;
            setRejectTarget(null);
            await fetchData();
        } catch (err: any) { alert("Denial failed: " + err.message); } finally { setIsActionLoading(false); }
    };

    const getStatusDisplay = (plan: PurchasePlan) => {
        const isMyAction = isMyTurnToApprove(plan);
        if (isMyAction) {
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[10px] animate-pulse"><Zap size={10} className="fill-current" /> Action Required</div>
                    <div className="text-[9px] text-slate-400 font-medium italic">Pending your signature</div>
                </div>
            );
        }
        if (plan.status.startsWith('Pending')) {
            const profile = getRequesterProfile(plan.requester);
            let waitingFor = 'HQ Admin';
            if (plan.status === 'Pending Supervisor' && profile) waitingFor = allUsers.find(u => u.id.toString() === profile.supervisorId)?.fullName || 'Supervisor';
            else if (plan.status === 'Pending Manager' && profile) waitingFor = allUsers.find(u => u.id.toString() === profile.managerId)?.fullName || 'Manager';
            return (<div className="flex flex-col gap-0.5"><div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px]"><Clock size={11} /> {plan.status.replace('Pending ', '')}</div><div className="text-[9px] text-slate-400 font-medium">Waiting for {waitingFor.split(' ')[0]}</div></div>);
        }
        if (plan.status === 'Approved') return <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]"><CheckCircle2 size={11} /> Approved</div>;
        return <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[10px]"><XCircle size={11} /> Rejected</div>;
    };

    const formatIDR = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Procurement center</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Managed investment and equipment requests</p></div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {[{ id: 'registry', icon: ListFilter, label: 'History' }, { id: 'approvals', icon: UserCheck, label: `My tasks (${stats.actionsCount})` }, { id: 'analytics', icon: BarChart3, label: 'Reports' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><tab.icon size={14} /> {tab.label}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Approved budget" value={formatIDR(stats.totalSpend)} icon={Wallet} color="emerald" subValue="Total verified" />
                <StatCard label="Tasks" value={stats.actionsCount} icon={ShieldCheck} color={stats.actionsCount > 0 ? "rose" : "blue"} subValue="Awaiting your ID" />
                <StatCard label="Global queue" value={stats.pendingCount} icon={Clock} color="amber" subValue="Requests in cycle" />
                <StatCard label="Fulfilled" value={stats.approvedCount} icon={CheckCircle2} color="blue" subValue="Completed nodes" />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
                <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <div className="relative flex-1 w-full md:max-w-md"><input type="text" placeholder="Search by hardware or account..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/20 rounded-2xl text-xs font-semibold dark:text-slate-200 transition-all outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" /></div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={fetchData} className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all" title="Force Data Sync"><RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /></button>
                        {canManage && <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/10">New request</button>}
                    </div>
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    {activeTab === 'analytics' ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center opacity-30 grayscale"><BarChart3 size={48} className="mb-4 text-slate-400" /><h3 className="text-sm font-bold text-slate-500">Analytics processing</h3><p className="text-[10px] text-slate-400 mt-1 font-medium">Syncing cost distribution trends...</p></div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] border-b border-slate-100 dark:border-slate-800 uppercase"><th className="px-6 py-4">Item identity</th><th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4 text-right">Commitment</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Originator</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{loading && !paginatedPlans.length ? (<tr><td colSpan={6} className="py-24 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={28} /></td></tr>) : paginatedPlans.length === 0 ? (<tr><td colSpan={6} className="py-24 text-center text-slate-300 dark:text-slate-700 font-bold text-xs italic">Registry empty.</td></tr>) : paginatedPlans.map(plan => {
                                const isMyTurn = isMyTurnToApprove(plan);
                                const requesterProfile = getRequesterProfile(plan.requester);
                                return (<tr key={plan.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group align-top ${isMyTurn ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}><td className="px-6 py-5"><div className="flex flex-col max-w-xs"><span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight mb-1 leading-tight">{plan.item}</span><span className="text-[10px] text-slate-400 dark:text-slate-600 line-clamp-1 italic">{plan.specs}</span></div></td><td className="px-6 py-5 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold">{plan.quantity}x</td><td className="px-6 py-5 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatIDR(plan.totalPrice)}</td><td className="px-6 py-5">{getStatusDisplay(plan)}</td><td className="px-6 py-5"><div className="flex flex-col"><div className="flex items-center gap-1.5"><p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{requesterProfile?.fullName || plan.requester}</p><Fingerprint size={10} className="text-blue-500 opacity-20" /></div><p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 font-mono">{plan.requestDate}</p></div></td><td className="px-6 py-5 text-center"><div className="flex items-center justify-center gap-1.5"><button onClick={() => { const profile = getRequesterProfile(plan.requester); setApproverNames({ spv: allUsers.find(u => u.id.toString() === profile?.supervisorId)?.fullName || '', manager: allUsers.find(u => u.id.toString() === profile?.managerId)?.fullName || '' }); setSelectedRequesterProfile(profile); setSelectedPlan(plan); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg" title="View Registry Entry"><Eye size={16} /></button>
                                    {isMyTurn ? (<><button onClick={() => handleApprove(plan)} disabled={isActionLoading} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-90" title="Authorize"><Check size={16} strokeWidth={3} /></button><button onClick={() => setRejectTarget(plan)} disabled={isActionLoading} className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all shadow-md active:scale-90" title="Deny"><X size={16} strokeWidth={3} /></button></>) : (canDelete && <button onClick={() => setDeletePlan(plan)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100" title="Purge Node"><Trash2 size={16} /></button>)}</div></td></tr>);
                            })}</tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0"><p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Page {currentPage} of {totalPages || 1} • {filteredPlans.length} records</p><div className="flex items-center gap-2"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all active:scale-90"><ChevronLeft size={16} /></button><button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all active:scale-90"><ChevronRight size={16} /></button></div></div>
            </div>

            <PurchaseRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={async (formData) => { try { const payload = { item: formData.item, specs: formData.specs, quantity: formData.quantity, unit_price: formData.unitPrice, total_price: formData.totalPrice, vendor: formData.vendor, status: formData.status || 'Pending Approval', requester: currentUser?.username || formData.requester, request_date: formData.requestDate, justification: formData.justification }; const { error } = await supabase.from('purchase_plans').insert([payload]); if (error) throw error; setIsModalOpen(false); fetchData(); } catch (err: any) { alert("Submission failed: " + err.message); } }} currentUserName={currentUser?.fullName} currentUser={currentUser} />
            <PurchaseDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} plan={selectedPlan} spvName={approverNames.spv} managerName={approverNames.manager} requesterProfile={selectedRequesterProfile} />
            <RejectReasonModal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} onSubmit={submitReject} itemName={rejectTarget?.item} />
            <DangerConfirmModal isOpen={!!deletePlan} onClose={() => setDeletePlan(null)} onConfirm={async () => { if (!deletePlan) return; await supabase.from('purchase_plans').delete().eq('id', deletePlan.id); setDeletePlan(null); fetchData(); }} title="Purge registry node" message={`Remove procurement request for "${deletePlan?.item}" permanently?`} />
        </div>
    );
};
