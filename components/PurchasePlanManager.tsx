'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, RefreshCcw, Check, X,
    Trash2, Wallet,
    Clock, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight,
    ListFilter, BarChart3, UserCheck, ShieldCheck, Zap, Fingerprint, Eye
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Cell, PieChart, Pie
} from 'recharts';
import { PurchasePlan, UserAccount } from '../types';
import { PurchaseRequestModal } from './PurchaseRequestModal';
import { PurchaseDetailModal } from './PurchaseDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { RejectReasonModal } from './RejectReasonModal';
import { supabase } from '../lib/supabaseClient';
import { StatCard } from './StatCard';
import { exportToExcel } from '../lib/excelExport';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from './ToastProvider';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


interface PurchasePlanManagerProps {
    currentUser: UserAccount | null;
}

type ProcurementTab = 'registry' | 'approvals' | 'analytics';

export const PurchasePlanManager: React.FC<PurchasePlanManagerProps> = ({ currentUser }) => {
    const { showToast } = useToast();
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
        return list.filter(p =>
            p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.vendor || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [plans, allUsers, searchTerm, activeTab, currentUser]);

    const handleExportExcel = () => {
        if (filteredPlans.length === 0) return;

        const dataToExport = filteredPlans.map(p => ({
            "Item": p.item,
            "Specs": p.specs,
            "Quantity": p.quantity,
            "Unit Price": p.unitPrice,
            "Total Price": p.totalPrice,
            "Vendor": p.vendor || "-",
            "Requester": p.requester,
            "Date": p.requestDate,
            "Status": p.status,
            "Justification": p.justification
        }));

        exportToExcel(dataToExport, `GESIT-PURCHASE-PLANS-${new Date().toISOString().split('T')[0]}`);
    };

    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPlans.slice(start, start + itemsPerPage);
    }, [filteredPlans, currentPage]);

    const analyticsData = useMemo(() => {
        const statuses = plans.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const vendors = plans.reduce((acc, p) => {
            const v = p.vendor || 'Unknown';
            acc[v] = (acc[v] || 0) + p.totalPrice;
            return acc;
        }, {} as Record<string, number>);

        const statusChart = Object.entries(statuses).map(([name, value]) => ({ name, value }));
        const vendorChart = Object.entries(vendors)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { statusChart, vendorChart };
    }, [plans]);

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
        } catch (err: any) { showToast("Authorization failed: " + err.message, 'error'); } finally { setIsActionLoading(false); }
    };

    const submitReject = async (reason: string) => {
        if (!rejectTarget) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('purchase_plans').update({ status: 'Rejected', justification: `${rejectTarget.justification}\n\n[DENIED]: ${reason}` }).eq('id', rejectTarget.id);
            if (error) throw error;
            setRejectTarget(null);
            await fetchData();
        } catch (err: any) { showToast("Denial failed: " + err.message, 'error'); } finally { setIsActionLoading(false); }
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
            <PageHeader
                title="Procurement Center"
                description="Managed investment & equipment audit log"
            >
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
                    <TabsList className="grid grid-cols-3 w-[400px] h-10 p-1 bg-muted/50 rounded-lg">
                        <TabsTrigger value="registry" className="text-[10px] font-bold uppercase tracking-widest gap-2">
                            <ListFilter size={14} /> REGISTRY
                        </TabsTrigger>
                        <TabsTrigger value="approvals" className="text-[10px] font-bold uppercase tracking-widest gap-2">
                            <UserCheck size={14} /> TASKS ({stats.actionsCount})
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="text-[10px] font-bold uppercase tracking-widest gap-2">
                            <BarChart3 size={14} /> REPORTS
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Approved budget" value={formatIDR(stats.totalSpend)} icon={Wallet} color="emerald" subValue="Total verified" />
                <StatCard label="Tasks" value={stats.actionsCount} icon={ShieldCheck} color={stats.actionsCount > 0 ? "rose" : "blue"} subValue="Awaiting your ID" />
                <StatCard label="Global queue" value={stats.pendingCount} icon={Clock} color="amber" subValue="Requests in cycle" />
                <StatCard label="Fulfilled" value={stats.approvedCount} icon={CheckCircle2} color="blue" subValue="Completed nodes" />
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden flex flex-col min-h-[550px]">
                <div className="px-6 py-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-card sticky top-0 z-20">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search by hardware or account..." 
                            className="w-full pl-11 bg-muted/20 border-muted-foreground/10 focus-visible:ring-1 focus-visible:ring-primary h-11" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleExportExcel}
                                className="h-11 w-11 text-emerald-600 hover:text-emerald-700 border-muted-foreground/10"
                                title="Export Excel"
                            >
                                <FileSpreadsheet size={18} />
                            </Button>
                            <Button 
                                variant="outline"
                                size="icon"
                                onClick={fetchData} 
                                className="h-11 w-11 text-muted-foreground hover:text-primary border-muted-foreground/10"
                            >
                                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                            </Button>
                        </div>
                        {canManage && (
                            <Button 
                                onClick={() => setIsModalOpen(true)} 
                                className="h-11 px-6 font-bold uppercase text-[10px] tracking-widest shadow-sm gap-2"
                            >
                                New request
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    {activeTab === 'analytics' ? (
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Status Distribution */}
                                <div className="bg-muted/20 p-6 rounded-lg border">

                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Clock size={14} /> Workflow Distribution
                                    </h3>
                                    <div className="h-64 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData.statusChart}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {analyticsData.statusChart.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{plans.length}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Requests</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {analyticsData.statusChart.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-md border text-foreground">

                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][idx % 5] }} />
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase truncate">{s.name}</span>
                                                <span className="ml-auto text-xs font-bold">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Vendors Spending */}
                                <div className="bg-muted/20 p-6 rounded-lg border">

                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <ShoppingCart size={14} /> Top Projected Spend by Vendor
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.vendorChart} margin={{ top: 0, right: 30, left: 10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                <YAxis hide />
                                                <Tooltip 
                                                    formatter={(value: number) => formatIDR(value)}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {analyticsData.vendorChart.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={1 - (index * 0.15)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase mt-4 tracking-tighter italic">Aggregated cost from all request types</p>
                                </div>
                            </div>

                            {/* Recent Activity Mini Feed Placeholder or High Level Trend */}
                            <div className="p-12 text-center border-t border-slate-100 dark:border-slate-800 border-dashed">
                                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">Full Audit Trail Synced with Corporate Ledger</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-5">Item Identity</th>
                                    <th className="px-6 py-5 text-center">Qty</th>
                                    <th className="px-6 py-5 text-right">Commitment</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Originator</th>
                                    <th className="px-6 py-5 text-center">Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading && !paginatedPlans.length ? (
                                    Array.from({ length: 10 }).map((_, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2 max-w-xs">
                                                    <Skeleton className="h-4 w-3/4 rounded-md" />
                                                    <Skeleton className="h-3 w-1/2" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center flex justify-center">
                                                <Skeleton className="h-4 w-8 rounded-md" />
                                            </td>
                                            <td className="px-6 py-5">
                                                <Skeleton className="h-4 w-20 ml-auto rounded-md" />
                                            </td>
                                            <td className="px-6 py-5">
                                                <Skeleton className="h-4 w-24 rounded-full" />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 flex justify-center">
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedPlans.length === 0 ? (
                                    <tr><td colSpan={6} className="py-24 text-center text-slate-300 dark:text-slate-700 font-bold text-xs italic">Registry empty.</td></tr>
                                ) : paginatedPlans.map(plan => {
                                    const isMyTurn = isMyTurnToApprove(plan);
                                    const requesterProfile = getRequesterProfile(plan.requester);
                                    return (<tr key={plan.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group align-top ${isMyTurn ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}><td className="px-6 py-5"><div className="flex flex-col max-w-xs"><span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight mb-1 leading-tight">{plan.item}</span><span className="text-[10px] text-slate-400 dark:text-slate-600 line-clamp-1 italic">{plan.specs}</span></div></td><td className="px-6 py-5 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold">{plan.quantity}x</td><td className="px-6 py-5 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatIDR(plan.totalPrice)}</td><td className="px-6 py-5">{getStatusDisplay(plan)}</td><td className="px-6 py-5"><div className="flex flex-col"><div className="flex items-center gap-1.5"><p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{requesterProfile?.fullName || plan.requester}</p><Fingerprint size={10} className="text-blue-500 opacity-20" /></div><p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 font-mono">{plan.requestDate}</p></div></td><td className="px-6 py-5 text-center"><div className="flex items-center justify-center gap-1.5"><button onClick={() => { const profile = getRequesterProfile(plan.requester); setApproverNames({ spv: allUsers.find(u => u.id.toString() === profile?.supervisorId)?.fullName || '', manager: allUsers.find(u => u.id.toString() === profile?.managerId)?.fullName || '' }); setSelectedRequesterProfile(profile); setSelectedPlan(plan); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg" title="View Registry Entry"><Eye size={16} /></button>
                                        {isMyTurn ? (<><button onClick={() => handleApprove(plan)} disabled={isActionLoading} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-90" title="Authorize"><Check size={16} strokeWidth={3} /></button><button onClick={() => setRejectTarget(plan)} disabled={isActionLoading} className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all shadow-md active:scale-90" title="Deny"><X size={16} strokeWidth={3} /></button></>) : (canDelete && <button onClick={() => setDeletePlan(plan)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100" title="Purge Node"><Trash2 size={16} /></button>)}</div></td></tr>);
                                })}</tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between shrink-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Page {currentPage} of {totalPages || 1} • {filteredPlans.length} records</p>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={currentPage === totalPages || totalPages === 0} 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>

            </div>

            <PurchaseRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={async (formData) => { try { const payload = { item: formData.item, specs: formData.specs, quantity: formData.quantity, unit_price: formData.unitPrice, total_price: formData.totalPrice, vendor: formData.vendor, status: formData.status || 'Pending Approval', requester: currentUser?.username || formData.requester, request_date: formData.requestDate, justification: formData.justification }; const { error } = await supabase.from('purchase_plans').insert([payload]); if (error) throw error; setIsModalOpen(false); showToast("Request submitted successfully", "success"); fetchData(); } catch (err: any) { showToast("Submission failed: " + err.message, "error"); } }} currentUserName={currentUser?.fullName} currentUser={currentUser} />
            <PurchaseDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} plan={selectedPlan} spvName={approverNames.spv} managerName={approverNames.manager} requesterProfile={selectedRequesterProfile} />
            <RejectReasonModal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} onSubmit={submitReject} itemName={rejectTarget?.item} />
            <DangerConfirmModal isOpen={!!deletePlan} onClose={() => setDeletePlan(null)} onConfirm={async () => { if (!deletePlan) return; await supabase.from('purchase_plans').delete().eq('id', deletePlan.id); setDeletePlan(null); fetchData(); }} title="Purge registry node" message={`Remove procurement request for "${deletePlan?.item}" permanently?`} />
        </div>
    );
};
