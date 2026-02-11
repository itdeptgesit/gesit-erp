'use client';

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, RefreshCcw, Network, Box, Zap,
    ListTodo, LifeBuoy, ChevronRight, AlertCircle, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ActivityLog, PortStatus, Announcement } from '../types';
import { StatCard } from './StatCard';

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

// --- Main Component ---

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate, userName, userRole = 'User' }) => {
    const [isLoading, setIsLoading] = useState(true);
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
                supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
                supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Resolved', 'Closed']),
                supabase.from('weekly_plans').select('status'),
                supabase.from('switch_ports').select('status'),
                supabase.from('purchase_plans').select('status, total_price'),
                supabase.from('purchase_records').select('total_va, purchase_date, status, department'),
                supabase.from('helpdesk_tickets').select('priority, status'),
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-lg shrink-0">
                        <Zap size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                            <span className="px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg uppercase tracking-widest">
                                {userRole} Terminal
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">System operational overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchData} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95 group">
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 text-emerald-500 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Online
                    </div>
                </div>
            </div>

            {/* --- ADMIN VIEW --- */}
            {isAdmin ? (
                <>
                    {/* --- PRIORITY CENTER --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden h-full min-h-[220px]">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.25em] mb-1">Priority Operations</h3>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Action Required</h2>
                                <div className="space-y-4">
                                    <div className="group flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => onNavigate('purchase')}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.pendingPurchases} Pending Approvals</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <div className="group flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => onNavigate('helpdesk')}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.openTickets} Open Helpdesk Tickets</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
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

                    {/* --- KPI CARDS --- */}
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
                </>
            ) : (
                /* --- USER VIEW --- */
                <>
                    {/* User Summary */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                            My Dashboard
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatCard
                                label="My Tasks"
                                value={stats.personalTasks.length}
                                subValue="Active tasks"
                                icon={ListTodo}
                                color="blue"
                                onClick={() => onNavigate('weekly')}
                            />
                            <StatCard
                                label="My Loans"
                                value={stats.activeLoans}
                                subValue="Active items"
                                icon={Zap}
                                color="indigo"
                                onClick={() => onNavigate('asset-loan')}
                            />
                            <StatCard
                                label="Open Tickets"
                                value={0} // Mocked for personal view
                                subValue="Reported issues"
                                icon={LifeBuoy}
                                color="rose"
                                onClick={() => onNavigate('helpdesk')}
                            />
                        </div>
                    </div>

                    {/* User Task List */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                My Upcoming Tasks
                            </h3>
                            <button onClick={() => onNavigate('weekly')} className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {stats.personalTasks.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <ListTodo size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>You have no pending tasks. Great job!</p>
                                </div>
                            ) : (
                                stats.personalTasks.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{task.task}</h4>
                                                <p className="text-xs text-slate-500">{new Date(task.due_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">{task.status}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};