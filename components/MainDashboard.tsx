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
import { Badge } from "@/components/ui/badge";

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
    purchaseCategoryData: { name: string; value: number }[];
    budgetUtilization: {
        total: number;
        paid: number;
        utilizationRate: number;
    };
}

interface MainDashboardProps {
    onNavigate: (view: string) => void;
    userName?: string;
    userRole?: string;
    currentUser?: UserAccount | null;
}

// --- Helper Components ---

const PriorityItem = ({ title, count, type, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${type === 'critical' ? 'bg-destructive/10 text-destructive' :
                type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-muted text-muted-foreground'
                }`}>
                {type === 'critical' ? <AlertCircle size={16} /> : type === 'warning' ? <Clock size={16} /> : <ListTodo size={16} />}
            </div>
            <div>
                <h4 className="font-semibold text-foreground text-sm">{title}</h4>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Attention required</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{count}</span>
            <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-all" />
        </div>
    </div>
);

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

// --- Dashboard Modes ---
type DashboardMode = 'personal' | 'organization';

// --- Main Component ---

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate, userName, userRole = 'User', currentUser }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<DashboardMode>('personal');
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
        vendors: [],
        purchaseCategoryData: [],
        budgetUtilization: { total: 0, paid: 0, utilizationRate: 0 }
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
                vendors: vendorList,
                purchaseCategoryData: Object.entries((purchaseRecords || []).filter((r: any) => r.status === 'Paid').reduce((acc: any, curr: any) => {
                    const cat = curr.category || 'Other';
                    acc[cat] = (acc[cat] || 0) + (curr.total_va || 0);
                    return acc;
                }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value),
                budgetUtilization: (() => {
                    const total = (purchaseRecords || []).reduce((sum: number, r: any) => sum + (Number(r.total_va) || 0), 0);
                    const paid = (purchaseRecords || []).filter((r: any) => r.status === 'Paid').reduce((sum: number, r: any) => sum + (Number(r.total_va) || 0), 0);
                    return {
                        total,
                        paid,
                        utilizationRate: total > 0 ? Math.round((paid / total) * 100) : 0
                    };
                })()
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
                title="Control Center"
                description={`Systems operational. Welcome back, ${userName?.split(' ')[0] || 'User'}.`}
            >
                <div className="flex items-center gap-4">
                    {/* Tab Switcher - Match Screenshot */}
                    <div className="flex items-center border-b border-border mb-[-1.5rem] pt-1">
                        {(['personal', 'organization'] as DashboardMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setActiveMode(mode)}
                                className={`
                                    px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition-all relative
                                    ${activeMode === mode
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }
                                `}
                            >
                                {mode}
                                {activeMode === mode && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    <div className="hidden md:flex items-center gap-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                                <LayoutGrid size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="h-9 w-40 bg-muted/50 border border-border rounded-lg pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchData}
                            className="h-9 w-9 rounded-lg border-border bg-background"
                        >
                            <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </Button>
                    </div>
                </div>
            </PageHeader>

            {/* --- DASHBOARD CONTENT SWITCHER --- */}
            {activeMode === 'personal' ? (
                /* PERSONAL VIEW (Referencing Screenshot 1) */
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    {/* Stat Cards - Row 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="My Open Tickets" value={stats.openTickets} subValue="+2 Today"
                            icon={LifeBuoy} color="blue" onClick={() => onNavigate('helpdesk')}
                        />
                        <StatCard
                            label="My Asset Loans" value={stats.activeLoans} subtext="On Loan"
                            icon={Box} color="amber" onClick={() => onNavigate('asset-loan')}
                        />
                        <StatCard
                            label="My Procurement" value={stats.pendingPurchases} subtext="Pending"
                            icon={ShoppingCart} color="emerald" onClick={() => onNavigate('purchase')}
                        />
                        <StatCard
                            label="My Tasks Today" value={stats.personalTasks.length} subtext="1 Overdue"
                            icon={ListTodo} color="indigo" onClick={() => onNavigate('weekly')}
                        />
                    </div>

                    {/* Main Grid - Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* My Tasks Today */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">My Tasks Today</h3>
                            </div>
                            <div className="space-y-4">
                                {stats.personalTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 group">
                                        <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-primary transition-colors cursor-pointer">
                                            <div className="w-2 h-2 bg-primary rounded-sm opacity-0 group-hover:opacity-100" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{task.task}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{task.due_date || 'Today'}</p>
                                        </div>
                                        {task.status === 'Overdue' && <Badge variant="destructive" className="text-[8px] h-3.5 px-1 font-bold">OVERDUE</Badge>}
                                    </div>
                                ))}
                                <Button variant="link" className="px-0 h-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary mt-2" onClick={() => onNavigate('weekly')}>
                                    View All Tasks
                                </Button>
                            </div>
                        </div>

                        {/* My Tickets Overview Chart */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">My Tickets</h3>
                                <Activity size={14} className="text-muted-foreground" />
                            </div>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={[
                                        { day: 'Mon', open: 2, wip: 1 }, { day: 'Tue', open: 4, wip: 2 },
                                        { day: 'Wed', open: 3, wip: 3 }, { day: 'Thu', open: 1, wip: 1 }
                                    ]}>
                                        <ReTooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="open" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="wip" fill="#ffd700" radius={[4, 4, 0, 0]} />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center">
                                <Button variant="link" size="sm" onClick={() => onNavigate('helpdesk')} className="text-xs font-semibold text-primary">
                                    View My Tickets <ChevronRight size={12} className="ml-1" />
                                </Button>
                            </div>
                        </div>

                        {/* My Borrowed Assets */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">My Assets</h3>
                                <Box size={14} className="text-muted-foreground" />
                            </div>
                            <div className="space-y-4">
                                {stats.upcomingLoans.slice(0, 2).map((loan: any, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                            <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{loan.borrower_name || 'My Asset'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{loan.it_assets?.item_name || 'Device'}</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-muted-foreground">APR 25</div>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full mt-4 justify-between text-[10px] font-bold uppercase tracking-wider h-8" onClick={() => onNavigate('asset-loan')}>
                                    View All <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Row 3 - Recent Activity & History */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                                <Activity size={14} className="text-muted-foreground" />
                            </div>
                            <div className="space-y-6">
                                {stats.recentActivities.length > 0 ? stats.recentActivities.slice(0, 3).map((act, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-colors">
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{act.activityName}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{act.itPersonnel} • {new Date(act.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-xs text-muted-foreground">No recent activities found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ORGANIZATION VIEW (Referencing Screenshot 2) */
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    {/* Header Controls for Organization */}
                    <div className="flex justify-end pr-4">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live Data</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    {/* Stat Cards - Row 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Open Tickets" value={stats.openTickets}
                            icon={LifeBuoy} color="blue" onClick={() => onNavigate('helpdesk')}
                            percentageChange={3.2} status="on-track"
                        />
                        <StatCard
                            label="Pending Procurement" value={stats.pendingPurchases}
                            icon={ShoppingCart} color="amber" onClick={() => onNavigate('purchase')}
                            percentageChange={6.4}
                        />
                        <StatCard
                            label="Total Assets" value={stats.totalAssets}
                            icon={Box} color="purple" onClick={() => onNavigate('assets')}
                            percentageChange={5.2} subValue="IT Inventory"
                        />
                        <StatCard
                            label="Task Health" value="100%"
                            icon={Zap} color="emerald" onClick={() => onNavigate('weekly')}
                            percentageChange={2.0} status="on-track" subValue="Overall Rate"
                        />
                    </div>

                    {/* Row 2 - Analysis Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Budget Utilization Chart */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold text-foreground">Budget Utilization</h3>
                                <PieChart size={14} className="text-muted-foreground" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-4 opacity-70">Paid vs Total Commitment</p>
                            
                            <div className="h-48 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={[
                                                { name: 'Paid', value: stats.budgetUtilization.paid },
                                                { name: 'Pending', value: Math.max(0, stats.budgetUtilization.total - stats.budgetUtilization.paid) }
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#e2e8f0" />
                                        </Pie>
                                        <ReTooltip />
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-foreground">{stats.budgetUtilization.utilizationRate}%</span>
                                    <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Utilized</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                                <div>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Paid Amount</p>
                                    <p className="text-xs font-bold text-emerald-600">{formatCurrency(stats.budgetUtilization.paid)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Total Committed</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(stats.budgetUtilization.total)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Critical Alerts */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">Critical Alerts</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                                    <AlertCircle size={14} className="text-rose-500" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">2 tickets are overdue for more than 3 days</span>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                                    <AlertCircle size={14} className="text-amber-500" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Loaned asset Laptop ID 841 is due in 2 days</span>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                                    <AlertCircle size={14} className="text-rose-500" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">1 procurement request pending review for 7 days</span>
                                </div>
                            </div>
                            <div className="mt-8 text-center border-t pt-4">
                                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-8">View All</Button>
                            </div>
                        </div>

                        {/* Purchase by Category Chart */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-foreground">Top Spend by Category</h3>
                                <TrendingUp size={14} className="text-muted-foreground" />
                            </div>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart
                                        layout="vertical"
                                        data={stats.purchaseCategoryData.slice(0, 5)}
                                        margin={{ left: 10, right: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <ReTooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                fontSize: '11px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {stats.purchaseCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'][index % 5]} />
                                            ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center border-t pt-2">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Based on Verified Payments</p>
                            </div>
                        </div>
                    </div>

                    {/* Row 3 - Asset Details & Activities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Asset Composition Pie */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm lg:col-span-1">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Asset Matrix</h3>
                            <div className="h-48 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={[{ v: 148 }, { v: 84 }, { v: 52 }, { v: 65 }]} innerRadius={50} outerRadius={70} dataKey="v">
                                            <Cell fill="#3b82f6" /><Cell fill="#f59e0b" /><Cell fill="#f43f5e" /><Cell fill="#10b981" />
                                        </Pie>
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-bold">{stats.totalAssets}</span>
                                    <span className="text-[8px] font-semibold uppercase text-muted-foreground">Total</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">IT UNITS</p>
                                    <p className="text-sm font-bold">251</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">GA UNITS</p>
                                    <p className="text-sm font-bold">65</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Purchase Activities */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-foreground">Recent Activities</h3>
                                <Activity size={14} className="text-muted-foreground" />
                            </div>
                            <div className="space-y-4">
                                {stats.recentActivities.length > 0 ? stats.recentActivities.map((act, i) => (
                                    <div key={i} className="flex gap-4 p-3 bg-muted/20 rounded-xl hover:bg-muted/40 transition-all border border-transparent hover:border-border">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Activity size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <p className="text-sm font-bold text-foreground truncate">{act.activityName}</p>
                                                <span className="text-[10px] font-bold text-muted-foreground shrink-0">{new Date(act.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{act.itPersonnel}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center opacity-30 italic text-xs">No ledger movement detected</div>
                                )}
                            </div>
                        </div>

                        {/* Active Loans List */}
                        <div className="bg-card rounded-xl p-6 border border-border shadow-sm lg:col-span-1">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Active Loans</h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                                            <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">User Name</p>
                                            <p className="text-[9px] text-muted-foreground truncate">Laptop Device</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground/50 text-right">04/24</span>
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