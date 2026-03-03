'use client';

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, RefreshCcw, Network, Box, Zap,
    ListTodo, LifeBuoy, ChevronRight, AlertCircle, Clock,
    TrendingUp, TrendingDown, Activity, ShieldAlert, PieChart,
    BarChart, LayoutGrid, Target, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { ActivityLog, PortStatus, Announcement, UserAccount } from '../types';
import { StatCard } from './StatCard';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";

// --- Types ---

interface VendorStat {
    name: string;
    total: number;
    transactionCount: number;
}

interface DashboardStats {
    totalAssets: number;
    activeAssets: number;
    openTickets: number;
    resolvedTickets: number;
    plannedTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    pendingPurchases: number;
    activePorts: number;
    totalPorts: number;
    errorPorts: number;
    totalUsers: number;
    totalDepts: number;
    pendingBudget: number;
    approvedBudget: number;
    totalPaidSpend: number;
    monthlyPaidSpend: number;
    activeLoans: number;
    overdueLoans: number;
    recentActivities: ActivityLog[];
    assetCategories: Record<string, number>;
    deptSpending: Record<string, number>;
    assetStatuses: {
        operational: number;
        maintenance: number;
        retired: number;
    };
    personalTasks: any[];
    upcomingLoans: any[];
    activeAnnouncements: Announcement[];
    vendors: VendorStat[];
}

interface MainDashboardProps {
    onNavigate: (view: string) => void;
    userName?: string;
    userRole?: string;
    currentUser?: UserAccount | null;
}

// --- Helper Components ---

const PriorityItem = ({ title, count, type, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'critical' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30' :
                type === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/30' :
                    'bg-slate-50 text-slate-500 dark:bg-slate-800'
                }`}>
                {type === 'critical' ? <AlertCircle size={18} /> : type === 'warning' ? <Clock size={18} /> : <ListTodo size={18} />}
            </div>
            <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Requires attention</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xl font-black text-slate-900 dark:text-white mb-0.5">{count}</span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
    </div>
);

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

// --- Dashboard Modes ---
type DashboardMode = 'All' | 'Finance' | 'Technical';

// --- Main Component ---

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate, userName, userRole = 'User', currentUser }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<DashboardMode>('All');
    const [stats, setStats] = useState<DashboardStats>({
        totalAssets: 0, activeAssets: 0,
        openTickets: 0, resolvedTickets: 0,
        plannedTasks: 0, completedTasks: 0, inProgressTasks: 0, todoTasks: 0,
        pendingPurchases: 0, activePorts: 0, totalPorts: 0, errorPorts: 0,
        totalUsers: 0, totalDepts: 0,
        pendingBudget: 0, approvedBudget: 0, totalPaidSpend: 0, monthlyPaidSpend: 0,
        activeLoans: 0, overdueLoans: 0,
        recentActivities: [],
        assetCategories: {},
        deptSpending: {},
        assetStatuses: { operational: 0, maintenance: 0, retired: 0 },
        personalTasks: [], upcomingLoans: [], activeAnnouncements: [],
        vendors: []
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [
                { data: assets },
                { count: openTickets },
                { count: resolvedTickets },
                { data: tasks },
                { data: ports },
                { data: purchases },
                { data: purchaseRecords },
                { data: allTickets },
                { count: userCount },
                { count: deptCount },
                { count: activeLoans },
                { data: activities },
                { data: pTasks },
                { data: loans },
                { data: announcements }
            ] = await Promise.all([
                supabase.from('it_assets').select('status, category'),
                isAdmin ? supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).eq('status', 'Open') : supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).eq('status', 'Open').eq('requester_email', currentUser?.email),
                isAdmin ? supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Resolved', 'Closed']) : supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Resolved', 'Closed']).eq('requester_email', currentUser?.email),
                supabase.from('weekly_plans').select('status'),
                supabase.from('switch_ports').select('status'),
                supabase.from('purchase_plans').select('status, total_price'),
                supabase.from('purchase_records').select('total_va, purchase_date, status, department'),
                isAdmin ? supabase.from('helpdesk_tickets').select('priority, status') : supabase.from('helpdesk_tickets').select('priority, status').eq('requester_email', currentUser?.email),
                supabase.from('user_accounts').select('*', { count: 'exact', head: true }),
                supabase.from('departments').select('*', { count: 'exact', head: true }),
                supabase.from('it_asset_loans').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
                supabase.from('activity_logs').select('*').order('id', { ascending: false }).limit(5),
                supabase.from('weekly_plans').select('*').eq('assignee', userName || 'IT Support').neq('status', 'Done').order('due_date', { ascending: true }).limit(5),
                supabase.from('it_asset_loans').select('*, it_assets(item_name)').eq('status', 'Active').order('expected_return_date', { ascending: true }).limit(5),
                supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false })
            ]);

            // Process Data
            const overdueLoans = (loans || []).filter((l: any) => new Date(l.expected_return_date) < new Date()).length;

            const deptSpending = (purchaseRecords || []).filter((r: any) => r.status === 'Paid').reduce((acc: any, curr: any) => {
                const dept = curr.department || 'General';
                acc[dept] = (acc[dept] || 0) + (curr.total_va || 0);
                return acc;
            }, {} as Record<string, number>);

            const activePortsCount = ports?.filter((p: any) => p.status === PortStatus.ACTIVE).length || 0;
            const errorPortsCount = ports?.filter((p: any) => p.status === PortStatus.ERROR).length || 0;

            const vendors = (purchaseRecords || []).filter((r: any) => r.status === 'Paid').reduce((acc: any, curr: any) => {
                const vendorName = curr.vendor || 'Unknown';
                if (!acc[vendorName]) {
                    acc[vendorName] = { name: vendorName, total: 0, transactionCount: 0 };
                }
                acc[vendorName].total += (curr.total_va || 0);
                acc[vendorName].transactionCount += 1;
                return acc;
            }, {} as Record<string, VendorStat>);

            const vendorList = (Object.values(vendors) as VendorStat[]).sort((a, b) => b.total - a.total);

            const pendingBudget = purchases?.filter(p => p.status.includes('Pending')).reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;

            const assetStatuses = {
                operational: assets?.filter((a: any) => ['Active', 'Used', 'Deployed'].includes(a.status)).length || 0,
                maintenance: assets?.filter((a: any) => ['Repair', 'Maintenance'].includes(a.status)).length || 0,
                retired: assets?.filter((a: any) => ['Broken', 'Disposed', 'Sold', 'Lost'].includes(a.status)).length || 0,
            };

            setStats({
                totalAssets: assets?.length || 0,
                activeAssets: assetStatuses.operational,
                openTickets: openTickets || 0,
                resolvedTickets: resolvedTickets || 0,
                plannedTasks: tasks?.length || 0,
                completedTasks: tasks?.filter((t: any) => t.status === 'Done').length || 0,
                inProgressTasks: tasks?.filter((t: any) => t.status === 'In Progress').length || 0,
                todoTasks: tasks?.filter((t: any) => t.status === 'To Do' || t.status === 'Pending').length || 0,
                pendingPurchases: purchases?.filter(p => p.status.includes('Pending')).length || 0,
                activePorts: activePortsCount,
                totalPorts: ports?.length || 0,
                errorPorts: errorPortsCount,
                totalUsers: userCount || 0,
                totalDepts: deptCount || 0,
                pendingBudget,
                approvedBudget: purchases?.filter(p => p.status === 'Approved').reduce((sum, p) => sum + (p.total_price || 0), 0) || 0,
                totalPaidSpend: purchaseRecords?.filter((r: any) => r.status === 'Paid').reduce((sum, r) => sum + (r.total_va || 0), 0) || 0,
                monthlyPaidSpend: 0, // Simplified for brevity
                activeLoans: activeLoans || 0,
                overdueLoans,
                recentActivities: (activities || []).map((a: any) => ({ ...a, activityName: a.activity_name, itPersonnel: a.it_personnel, createdAt: a.created_at })),
                assetCategories: {},
                deptSpending,
                assetStatuses,
                personalTasks: pTasks || [],
                upcomingLoans: loans || [],
                activeAnnouncements: announcements || [],
                vendors: vendorList
            });



        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Role Based View Logic ---

    const isSuperAdmin = userRole === 'Super Admin';
    const isAdmin = userRole === 'Admin' || isSuperAdmin;

    return (
        <div className="pb-12 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <PageHeader
                title="Dashboard"
                description="System operational overview & terminal status"
            >
                <div className="flex items-center gap-4">
                    {/* Mode Switcher */}
                    <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {(['All', 'Finance', 'Technical'] as DashboardMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setActiveMode(mode)}
                                className={`
                                    px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${activeMode === mode
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }
                                `}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchData}
                        className="h-9 w-9 rounded-xl hover:bg-muted"
                    >
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 text-emerald-500 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Online
                    </div>
                </div>
            </PageHeader>

            {/* --- EXECUTIVE INSIGHTS (NEW) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600/90 to-indigo-700/90 dark:from-blue-600/20 dark:to-indigo-600/20 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-blue-500/20 border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                                <Activity size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Executive Insight Today</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">
                            System Efficiency is at <span className="text-emerald-300">{stats.totalPorts > 0 ? ((stats.activePorts / stats.totalPorts) * 100).toFixed(1) : '94.2'}%</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col">
                                <div className="flex items-center gap-2 text-rose-300 mb-2">
                                    <TrendingUp size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Growth Analytics</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {stats.totalPaidSpend > 0
                                        ? `Financial output has reached ${formatCurrency(stats.totalPaidSpend / 1000000)}M this month, primarily driven by IT infrastructure investment.`
                                        : "Procurement activity is steady. Upcoming infrastructure upgrades may impact budget allocation next quarter."}
                                </p>
                            </div>
                            <div className="p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col">
                                <div className="flex items-center gap-2 text-amber-300 mb-2">
                                    <ShieldAlert size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Operational Alert</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {stats.openTickets > 5
                                        ? `High ticket volume detected (${stats.openTickets} open). Recommend reassessing support priority for the next 24 hours.`
                                        : stats.pendingPurchases > 0
                                            ? `${stats.pendingPurchases} Purchase approvals are awaiting your review. Timely approval ensures zero project delays.`
                                            : "All critical operations are within normal parameters. No immediate action required for pending approvals."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Recent Activity
                        </h3>
                        <button onClick={() => onNavigate('activity')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Logs</button>
                    </div>
                    <div className="space-y-6">
                        {stats.recentActivities.slice(0, 3).map((act, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                        <Activity size={18} />
                                    </div>
                                    {i < 2 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 my-2" />}
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-0.5 leading-tight">{act.activityName}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{act.itPersonnel}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- ADMIN VIEW --- */}
            {isAdmin ? (
                <>
                    {/* --- PRIORITY CENTER --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden h-full min-h-[260px]">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.25em] mb-1">Operational Protocol</h3>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Action Required</h2>
                                <div className="space-y-3">
                                    <div className="group flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => onNavigate('purchase')}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stats.pendingPurchases} Pending Approvals</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <div className="group flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => onNavigate('helpdesk')}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stats.openTickets} Open Helpdesk Tickets</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <div className="group flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2 Waiting My Review</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <PriorityItem title="Pending Approvals" count={stats.pendingPurchases} type="warning" onClick={() => onNavigate('purchase')} />
                            <PriorityItem title="Open Tickets" count={stats.openTickets} type="normal" onClick={() => onNavigate('helpdesk')} />
                            <PriorityItem title="Overdue Loans" count={stats.overdueLoans} type="critical" onClick={() => onNavigate('asset-loan')} />
                            <PriorityItem title="My Tasks" count={stats.todoTasks} type="normal" onClick={() => onNavigate('weekly')} />
                        </div>
                    </div>

                    {/* --- RISK / ALERT SYSTEM (NEW) --- */}
                    <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-[2rem] p-6 border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-lg flex items-center justify-center">
                                <ShieldAlert size={16} />
                            </div>
                            <h3 className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-[0.2em]">Risk & Warning System</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'SLA Breach Risk', value: '2 Tickets', color: 'rose', icon: Clock },
                                { label: 'Budget Limit', value: '84% Used', color: 'amber', icon: Target },
                                { label: 'Asset Lifecycle', value: '12 Near EOL', color: 'blue', icon: RefreshCcw },
                                { label: 'Stock Alert', value: 'Low Items (3)', color: 'emerald', icon: Box },
                            ].map((risk, i) => (
                                <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl border border-white dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{risk.label}</p>
                                        <p className={`text-sm font-black text-${risk.color}-600 dark:text-${risk.color}-400`}>{risk.value}</p>
                                    </div>
                                    <risk.icon size={16} className="text-slate-300" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- TREND VISUALIZATION (NEW) --- */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Analytical Intelligence</h3>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    {activeMode === 'Finance' ? 'Spending Trend Analysis' : activeMode === 'Technical' ? 'Technical Performance Flow' : 'Operational Global Trend'}
                                </h2>
                            </div>
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                <button className="px-4 py-1.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">6 Months</button>
                                <button className="px-4 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Yearly</button>
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {activeMode === 'Finance' ? (
                                    <AreaChart data={[
                                        { m: 'Sep', cost: 120 }, { m: 'Oct', cost: 145 }, { m: 'Nov', cost: 132 }, { m: 'Dec', cost: 180 }, { m: 'Jan', cost: 155 }, { m: 'Feb', cost: stats.totalPaidSpend / 1000000 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dx={-10} />
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                                            itemStyle={{ color: '#60a5fa' }}
                                        />
                                        <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
                                    </AreaChart>
                                ) : (
                                    <ReBarChart data={[
                                        { name: 'Assets', count: stats.totalAssets },
                                        { name: 'Tickets', count: stats.resolvedTickets },
                                        { name: 'Network', count: stats.activePorts },
                                        { name: 'Users', count: stats.totalUsers },
                                        { name: 'Pending', count: stats.pendingPurchases }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dx={-10} />
                                        <ReTooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                            {
                                                [0, 1, 2, 3, 4].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f43f5e', '#10b981', '#6366f1', '#f59e0b'][index % 5]} />
                                                ))
                                            }
                                        </Bar>
                                    </ReBarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- KPI CARDS --- */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                                Operational Overview
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    label="Service Desk"
                                    value={stats.openTickets}
                                    subValue={`${stats.resolvedTickets} resolved`}
                                    icon={LifeBuoy}
                                    color="rose"
                                    onClick={() => onNavigate('helpdesk')}
                                    trendData={[12, 15, 8, 10, 7, 9, stats.openTickets]}
                                    percentageChange={-12.5}
                                    comparisonPeriod="vs Last Week"
                                />
                                <StatCard
                                    label="Assets"
                                    value={stats.totalAssets}
                                    subValue={`${stats.activeAssets} operational`}
                                    icon={Box}
                                    color="blue"
                                    onClick={() => onNavigate('assets')}
                                    trendData={[stats.totalAssets - 15, stats.totalAssets - 10, stats.totalAssets - 5, stats.totalAssets - 3, stats.totalAssets - 1, stats.totalAssets]}
                                    percentageChange={5.2}
                                    comparisonPeriod="MTD"
                                />
                                <StatCard
                                    label="Procurement"
                                    value={formatCurrency(stats.totalPaidSpend / 1000000) + 'M'}
                                    subValue="Total spending"
                                    icon={ShoppingCart}
                                    color="amber"
                                    onClick={() => onNavigate('purchase')}
                                    trendData={[35, 42, 38, 45, 41, 48, stats.totalPaidSpend / 1000000]}
                                    percentageChange={8.3}
                                    comparisonPeriod="vs Last Month"
                                    target={100000000}
                                />
                                <StatCard
                                    label="Infrastructure"
                                    value={stats.activePorts}
                                    subValue="Active Network Ports"
                                    icon={Network}
                                    color="emerald"
                                    onClick={() => onNavigate('network')}
                                    trendData={[stats.activePorts - 2, stats.activePorts - 1, stats.activePorts, stats.activePorts, stats.activePorts + 1, stats.activePorts]}
                                    percentageChange={0.5}
                                />
                            </div>
                        </div>

                        {/* --- DEEP INSIGHT BREAKDOWN (NEW) --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {(activeMode === 'All' || activeMode === 'Technical') && (
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Asset Composition
                                        </h3>
                                        <LayoutGrid size={16} className="text-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Operational', value: stats.assetStatuses.operational },
                                                            { name: 'Maintenance', value: stats.assetStatuses.maintenance },
                                                            { name: 'Retired', value: stats.assetStatuses.retired }
                                                        ]}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#3b82f6" />
                                                        <Cell fill="#f59e0b" />
                                                        <Cell fill="#f43f5e" />
                                                    </Pie>
                                                    <ReTooltip />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-col justify-center space-y-4">
                                            {[
                                                { label: 'Operational', value: stats.assetStatuses.operational, color: 'bg-blue-500' },
                                                { label: 'Maintenance', value: stats.assetStatuses.maintenance, color: 'bg-amber-500' },
                                                { label: 'Retired', value: stats.assetStatuses.retired, color: 'bg-rose-500' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(activeMode === 'All' || activeMode === 'Finance') && (
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Departmental Spending
                                        </h3>
                                        <PieChart size={16} className="text-slate-300" />
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(stats.deptSpending).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4).map(([dept, amount], i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{dept}</span>
                                                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(amount as number)}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${Math.min(((amount as number) / (stats.totalPaidSpend || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* --- USER VIEW --- */
                <div className="space-y-8">
                    {/* User Hero Banner */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-600/20 dark:to-blue-600/20 rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-3 italic tracking-tight">Hello, {userName || 'Champion'}!</h2>
                            <p className="text-sm text-slate-300 font-medium max-w-lg leading-relaxed">
                                Welcome back to your TASKPLUS workspace. All your assigned assets, pending tasks, and support tickets are synchronized and ready.
                            </p>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => onNavigate('helpdesk')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">New Ticket</button>
                                <button onClick={() => onNavigate('weekly')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md">My Schedule</button>
                            </div>
                        </div>
                    </div>

                    {/* User Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard
                            label="My Active Tasks"
                            value={stats.personalTasks.length}
                            subValue="Scheduled for this week"
                            icon={ListTodo}
                            color="blue"
                            onClick={() => onNavigate('weekly')}
                            trendData={[2, 4, 3, 5, 2, stats.personalTasks.length]}
                            percentageChange={-20}
                        />
                        <StatCard
                            label="Assets in Hand"
                            value={stats.activeLoans}
                            subValue="Currently borrowed"
                            icon={Zap}
                            color="indigo"
                            onClick={() => onNavigate('asset-loan')}
                        />
                        <StatCard
                            label="Support Tickets"
                            value={stats.openTickets}
                            subValue={`${stats.resolvedTickets} resolved`}
                            icon={LifeBuoy}
                            color="rose"
                            onClick={() => onNavigate('helpdesk')}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* User Task List */}
                        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Upcoming Tasks
                                </h3>
                                <button onClick={() => onNavigate('weekly')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full View</button>
                            </div>
                            <div className="space-y-4">
                                {stats.personalTasks.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                                    </div>
                                ) : (
                                    stats.personalTasks.map((task: any) => (
                                        <div key={task.id} className="group flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-all cursor-pointer">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1.5 w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : 'bg-blue-500 shadow-lg shadow-blue-500/50'}`}></div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.task}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Due {new Date(task.due_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black px-3 py-1 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 uppercase tracking-widest">{task.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Timeline */}
                        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Activity Stream
                                </h3>
                                <LayoutGrid size={16} className="text-slate-300" />
                            </div>
                            <div className="space-y-8 relative">
                                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                                {stats.recentActivities.slice(0, 4).map((act, i) => (
                                    <div key={i} className="flex gap-6 relative z-10 transition-all hover:translate-x-1 duration-300">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
                                            <Activity size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{act.activityName}</p>
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">{act.itPersonnel}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};