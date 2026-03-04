import React, { useState, useEffect, useMemo } from 'react';
import {
    FolderKanban, ListChecks, CheckCircle2,
    Calendar, Zap, TrendingUp,
    Database, Activity, Megaphone,
    ShoppingCart, Box, Shield,
    MessageSquare, RefreshCcw, ChevronRight, Info, Phone, Search, ArrowUpRight, Target,
    Wallet, CheckCircle2 as CheckCircle2Icon, Clock, Briefcase, Tag
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { UserAccount, Announcement } from '../types';
import { StatCard } from './StatCard';
import { UserAvatar } from './UserAvatar';
import { useLanguage } from '../translations';

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskItem {
    id: number;
    task: string;
    category: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: string;
    owner?: string;
    startTime?: string;
}

interface ProjectItem {
    id: number;
    name: string;
    status: 'Completed' | 'In Progress' | 'On Hold' | 'Pending';
    progress: number;
    totalTasks: number;
    completedTasks: number;
    dueDate: string;
    owner: string;
}

interface PerformanceData {
    day: string;
    value: number;
    value2?: number;
}

interface TaskplusDashboardProps {
    onNavigate: (view: string) => void;
    userName?: string;
    userRole?: string;
    currentUser?: UserAccount | null;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", bg?: string, dot: string }> = {
        'Completed': { variant: 'outline', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
        'In Progress': { variant: 'outline', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-500' },
        'On Hold': { variant: 'outline', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500' },
        'Pending': { variant: 'outline', bg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' },
        'Done': { variant: 'outline', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
        'To Do': { variant: 'outline', bg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' },
    };
    const c = config[status] || config['Pending'];
    return (
        <Badge variant={c.variant} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${c.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status}
        </Badge>
    );
};

// ─── Component ────────────────────────────────────────────────────────────

export const TaskplusDashboard: React.FC<TaskplusDashboardProps> = ({ onNavigate, userName, userRole = 'User', currentUser }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [projectSearch, setProjectSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeMode, setActiveMode] = useState<'PERSONAL' | 'ORGANIZATION'>(currentUser?.role === 'Admin' ? 'ORGANIZATION' : 'PERSONAL');
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const [stats, setStats] = useState({
        // Personal KPI
        myOpenActivities: 0,
        myOpenTickets: 0,
        myTasksTodayCount: 0,
        myProcurementRequests: 0,
        myAssetLoans: 0,
        myOverdueItems: 0,

        // Organization KPI
        totalOpenTickets: 0,
        totalActiveActivities: 0,
        pendingProcurement: 0,
        totalPurchaseThisMonth: 0,
        totalITAssets: 0,
        activeAssetLoans: 0,
        taskCompletionRate: '0%',
        totalHighPriority: 0,
        totalOverdueOrg: 0,

        // Detailed Data
        procurementStats: { pending: 0, approved: 0, rejected: 0, totalBudget: 0 },
        personalAlerts: [] as string[],
        orgCritical: [] as string[],
        assetBreakdown: { it: 0, ga: 0, categories: {} as any },

        // Purchase Record Summary
        purchaseSummary: {
            totalDisbursed: 0,
            totalLiability: 0,
            fiscalVolume: 0,
            pendingCount: 0,
            totalRecords: 0,
            topCategories: [] as { name: string; total: number; percentage: number }[],
            topDepartments: [] as { name: string; total: number; percentage: number }[],
        },

        // Activity Heatmap
        activityHeatmap: {} as Record<string, number>,
        activityTotal: 0,
    });

    const [listData, setListData] = useState({
        myTasksToday: [] as any[],
        myActivities: [] as any[],
        myProcurement: [] as any[],
        myBorrowedAssets: [] as any[],
        orgActivities: [] as any[],
        orgRecentTickets: [] as any[],
        allProjects: [] as ProjectItem[]
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const tenDaysAgo = new Date(); tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

            const [
                { data: weeklyPlans },
                { data: purchasePlans },
                { data: helpTickets },
                { data: activities },
                { data: itAssets },
                { data: announcementsData },
                { data: purchaseRecords }
            ] = await Promise.all([
                supabase.from('weekly_plans').select('*').order('due_date', { ascending: true }),
                supabase.from('purchase_plans').select('*').order('request_date', { ascending: false }),
                supabase.from('helpdesk_tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
                supabase.from('it_assets').select('*'),
                supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
                supabase.from('purchase_records').select('id, subtotal, status, category, department, purchase_date, vendor').order('purchase_date', { ascending: false })
            ]);

            const currentUserName = currentUser?.fullName || '';

            // --- PERSONAL CALCULATIONS ---
            const myActivitiesRaw = (activities || []).filter(a => (a.requester === currentUserName || a.assigned_to === currentUserName) && a.status !== 'Completed');
            const myTicketsRaw = (helpTickets || []).filter(t => t.requester_name === currentUserName && (t.status === 'Open' || t.status === 'In Progress'));
            const myTasksToday = (weeklyPlans || []).filter(w => w.due_date === today && (w.owner === currentUserName || w.assigned_to === currentUserName));
            const myProcurements = (purchasePlans || []).filter(p => p.requester === currentUserName);
            const myLoans = (itAssets || []).filter(a => a.user_assigned === currentUserName && a.status === 'Used');

            // Overdue logic
            const overdueTasksCount = (weeklyPlans || []).filter(w => (w.owner === currentUserName || w.assigned_to === currentUserName) && w.status !== 'Done' && w.status !== 'Completed' && w.due_date && w.due_date < today).length;
            const overdueActivitiesCount = (activities || []).filter(a => (a.requester === currentUserName || a.assigned_to === currentUserName) && a.status !== 'Completed' && a.due_date && a.due_date < today).length;
            const myOverdueTotal = overdueTasksCount + overdueActivitiesCount;

            const personalAlerts: string[] = [];
            if (myOverdueTotal > 0) personalAlerts.push(`${myOverdueTotal} activity overdue`);
            const oldProcurement = myProcurements.find(p => (p.status === 'In Review' || p.status === 'Draft') && p.request_date && new Date(p.request_date) < fiveDaysAgo);
            if (oldProcurement) personalAlerts.push(`1 procurement pending > 5 hari`);
            const nearDueLoan = myLoans.find(a => a.due_date && (new Date(a.due_date).getTime() - new Date().getTime()) < 3 * 24 * 3600 * 1000);
            if (nearDueLoan) personalAlerts.push(`1 loan hampir jatuh tempo`);

            // --- ORGANIZATION CALCULATIONS ---
            const totalTickets = (helpTickets || []).filter(t => t.status !== 'Closed' && t.status !== 'Resolved');
            const activeActivities = (activities || []).filter(a => a.status !== 'Completed');
            const pendingProc = (purchasePlans || []).filter(p => p.status === 'In Review' || p.status === 'Draft');
            const thisMonthPurchases = (purchasePlans || []).filter(p => {
                if (!p.request_date) return false;
                const d = new Date(p.request_date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const totalPurchaseVal = thisMonthPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            const totalAssets = (itAssets || []).length;
            const activeLoans = (itAssets || []).filter(a => a.status === 'Used').length;
            const completionRate = weeklyPlans && weeklyPlans.length > 0 ?
                `${Math.round((weeklyPlans.filter(w => w.status === 'Done' || w.status === 'Completed').length / weeklyPlans.length) * 100)}%` : '0%';

            const orgAlerts: string[] = [];
            const oldTickets = totalTickets.filter(t => new Date(t.created_at) < threeDaysAgo).length;
            if (oldTickets >= 3) orgAlerts.push(`${oldTickets} tickets > 3 hari belum close`);
            const oldOrgProc = pendingProc.filter(p => p.request_date && new Date(p.request_date) < sevenDaysAgo).length;
            if (oldOrgProc >= 2) orgAlerts.push(`${oldOrgProc} procurement pending > 7 hari`);
            const overdueTotal = (weeklyPlans || []).filter(w => (w.status !== 'Done' && w.status !== 'Completed') && w.due_date && w.due_date < today).length;
            if (overdueTotal >= 4) orgAlerts.push(`${overdueTotal} activity overdue`);

            // --- PROJECTS DATA (FROM WEEKLY PLANS) ---
            const projectPlans = (weeklyPlans || []).filter(w => w.category === 'Project');
            const groupedProjects: Record<string, { tasks: any[]; latestDate: string; owner: string }> = {};

            projectPlans.forEach(task => {
                const name = task.task.split(':')[0] || 'Operational';
                if (!groupedProjects[name]) {
                    groupedProjects[name] = { tasks: [], latestDate: task.due_date || today, owner: task.assignee || 'IT' };
                }
                groupedProjects[name].tasks.push(task);
                if (task.due_date > groupedProjects[name].latestDate) groupedProjects[name].latestDate = task.due_date;
            });

            const projectItems: ProjectItem[] = Object.entries(groupedProjects).map(([name, data], index) => {
                const total = data.tasks.length;
                const completed = data.tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return {
                    id: index + 1,
                    name: name,
                    status: (progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending') as any,
                    progress,
                    totalTasks: total,
                    completedTasks: completed,
                    dueDate: data.latestDate,
                    owner: data.owner
                };
            });

            // Asset Breakdown - Real Categorization
            const itCategoryList = ['Laptop', 'PC', 'Server', 'Network', 'Monitor', 'Printer', 'Hardware'];
            let itCount = 0;
            let gaCount = 0;
            const assetCats: any = {};
            (itAssets || []).forEach(a => {
                const cat = a.category || 'Other';
                assetCats[cat] = (assetCats[cat] || 0) + 1;
                if (itCategoryList.some(c => cat.includes(c))) itCount++;
                else gaCount++;
            });

            setStats({
                myOpenActivities: myActivitiesRaw.length,
                myOpenTickets: myTicketsRaw.length,
                myTasksTodayCount: myTasksToday.length,
                myProcurementRequests: myProcurements.length,
                myAssetLoans: myLoans.length,
                myOverdueItems: myOverdueTotal,

                totalOpenTickets: totalTickets.length,
                totalActiveActivities: activeActivities.length,
                pendingProcurement: pendingProc.length,
                totalPurchaseThisMonth: totalPurchaseVal,
                totalITAssets: totalAssets,
                activeAssetLoans: activeLoans,
                taskCompletionRate: completionRate,
                totalHighPriority: (weeklyPlans || []).filter(w => w.priority === 'High' && w.status !== 'Done' && w.status !== 'Completed').length,
                totalOverdueOrg: overdueTotal,

                procurementStats: {
                    pending: myProcurements.filter(p => p.status === 'In Review').length,
                    approved: myProcurements.filter(p => p.status === 'Approved').length,
                    rejected: myProcurements.filter(p => p.status === 'Rejected').length,
                    totalBudget: myProcurements.reduce((acc, curr) => acc + (curr.amount || 0), 0)
                },
                personalAlerts,
                orgCritical: orgAlerts,
                assetBreakdown: {
                    it: itCount,
                    ga: gaCount,
                    categories: assetCats
                },

                // Purchase Record Summary
                purchaseSummary: (() => {
                    const recs = purchaseRecords || [];
                    const totalDisbursed = recs.filter(r => r.status === 'Paid').reduce((sum: number, r: any) => sum + (r.subtotal || 0), 0);
                    const totalLiability = recs.filter(r => r.status !== 'Paid').reduce((sum: number, r: any) => sum + (r.subtotal || 0), 0);
                    const fiscalVolume = recs.reduce((sum: number, r: any) => sum + (r.subtotal || 0), 0);
                    const pendingCount = recs.filter(r => r.status === 'Pending').length;

                    // Top Categories
                    const catMap: Record<string, number> = {};
                    recs.forEach((r: any) => {
                        const cat = r.category || 'Uncategorized';
                        catMap[cat] = (catMap[cat] || 0) + (r.subtotal || 0);
                    });
                    const topCategories = Object.entries(catMap)
                        .map(([name, total]) => ({ name, total, percentage: fiscalVolume > 0 ? Math.round((total / fiscalVolume) * 100) : 0 }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 5);

                    // Top Departments
                    const deptMap: Record<string, number> = {};
                    recs.forEach((r: any) => {
                        const dept = r.department || 'Unknown';
                        deptMap[dept] = (deptMap[dept] || 0) + (r.subtotal || 0);
                    });
                    const topDepartments = Object.entries(deptMap)
                        .map(([name, total]) => ({ name, total, percentage: fiscalVolume > 0 ? Math.round((total / fiscalVolume) * 100) : 0 }))
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 5);

                    return { totalDisbursed, totalLiability, fiscalVolume, pendingCount, totalRecords: recs.length, topCategories, topDepartments };
                })(),

                // Activity Heatmap — count activities per day from multiple sources
                activityHeatmap: (() => {
                    const heatmap: Record<string, number> = {};
                    // Count from activity_logs
                    (activities || []).forEach((a: any) => {
                        const day = a.created_at?.split('T')[0];
                        if (day) heatmap[day] = (heatmap[day] || 0) + 1;
                    });
                    // Count from helpdesk_tickets
                    (helpTickets || []).forEach((t: any) => {
                        const day = t.created_at?.split('T')[0];
                        if (day) heatmap[day] = (heatmap[day] || 0) + 1;
                    });
                    // Count from weekly_plans
                    (weeklyPlans || []).forEach((w: any) => {
                        const day = w.created_at?.split('T')[0] || w.due_date;
                        if (day) heatmap[day] = (heatmap[day] || 0) + 1;
                    });
                    return heatmap;
                })(),
                activityTotal: (activities || []).length + (helpTickets || []).length + (weeklyPlans || []).length,
            });

            setListData({
                myTasksToday,
                myActivities: myActivitiesRaw.slice(0, 5),
                myProcurement: myProcurements.slice(0, 5),
                myBorrowedAssets: myLoans,
                orgActivities: activeActivities.slice(0, 10),
                orgRecentTickets: totalTickets.slice(0, 10),
                allProjects: projectItems
            });

            // --- PERFORMANCE DATA (REAL TICKET TRENDS) ---
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const performanceTrend = last7Days.map(date => {
                const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                const ticketsOnDay = (helpTickets || []).filter(t => t.created_at?.split('T')[0] === date);
                const resolvedOnDay = (helpTickets || []).filter(t => (t.status === 'Resolved' || t.status === 'Closed') && t.updated_at?.split('T')[0] === date);

                return {
                    day: dayLabel,
                    value: ticketsOnDay.length, // Open/New
                    value2: resolvedOnDay.length // Resolved
                };
            });
            setPerformanceData(performanceTrend);

            setAnnouncements(announcementsData || []);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredProjects = useMemo(() => {
        return listData.allProjects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    }, [listData.allProjects, projectSearch]);

    const rpp = 10;
    const paginatedProjects = filteredProjects.slice((currentPage - 1) * rpp, currentPage * rpp);
    const totalPages = Math.max(Math.ceil(filteredProjects.length / rpp), 1);

    if (isLoading) {
        return (
            <div className="space-y-5 animate-pulse min-h-screen">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-10 bg-muted rounded-2xl w-64" />
                        <div className="h-5 bg-muted rounded-xl w-80" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-muted rounded-3xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700 pb-16">

            {/* --- CORE HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6 pt-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <Target size={16} className="animate-pulse" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-primary/20 text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">
                            {activeMode === 'PERSONAL' ? 'Operation Hub' : 'System Nexus'}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {activeMode === 'PERSONAL' ? 'My Workspace' : 'Control Tower'}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium max-w-lg">
                        {activeMode === 'PERSONAL'
                            ? 'Manage your daily technical roadmap and equipment efficiency.'
                            : 'Real-time synchronization of organizational health and infrastructure status.'}
                    </p>
                </div>

                <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
                    {(['PERSONAL', 'ORGANIZATION'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveMode(mode)}
                            className={`px-6 py-2 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all
                                ${activeMode === mode
                                    ? 'bg-background text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100'
                                }
                            `}
                        >
                            {mode === 'PERSONAL' ? 'Personal' : 'Organization'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- DASHBOARD CONTENT --- */}
            {activeMode === 'PERSONAL' ? (
                /* 🔷 MY WORKSPACE (PERSONAL) */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">

                    {/* 1. Summary Cards (Personal KPI) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard label="My Activities" value={stats.myOpenActivities} icon={Activity} color="indigo" subValue="Pending" />
                        <StatCard label="My Open Tickets" value={stats.myOpenTickets} icon={MessageSquare} color="blue" subValue="Active" />
                        <StatCard label="My Tasks Today" value={stats.myTasksTodayCount} icon={ListChecks} color="sky" subValue="Due today" />
                        <StatCard label="My Procurement" value={stats.myProcurementRequests} icon={ShoppingCart} color="amber" subValue="Requests" />
                        <StatCard label="My Asset Loans" value={stats.myAssetLoans} icon={Box} color="purple" subValue="Borrowed" />
                        <StatCard label="My Overdue Items" value={stats.myOverdueItems} icon={Zap} color="rose" subValue="Urgent" status={stats.myOverdueItems > 0 ? "at-risk" : "on-track"} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* 2. My Tasks Today (Planner Integration) */}
                        <Card className="lg:col-span-4 rounded-xl border-border shadow-sm overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-lg font-bold flex items-center justify-between">
                                    Today's Tasks
                                    <Badge variant="secondary" className="bg-primary/5 text-primary">Planner</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                {listData.myTasksToday.length > 0 ? (
                                    listData.myTasksToday.map((task, i) => {
                                        const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0];
                                        return (
                                            <div key={task.id} className={`flex gap-3 group p-3 rounded-lg border transition-all ${isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border/50'}`}>
                                                <div className={`w-1 h-8 rounded-full ${isOverdue ? 'bg-destructive' : 'bg-primary'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-sm font-semibold truncate ${isOverdue ? 'text-destructive' : ''}`}>{task.task}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{task.startTime || '08:00'}</span>
                                                        <div className="w-1 h-1 rounded-full bg-border" />
                                                        <StatusBadge status={task.status} />
                                                    </div>
                                                </div>
                                                {isOverdue && <Badge variant="destructive" className="h-4 text-[7px] font-bold">OVERDUE</Badge>}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="text-muted-foreground/30" size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-loose">No task scheduled today.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. My Activities & 6. Personal Alerts */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Personal Alerts (Smart Feature) */}
                            {stats.personalAlerts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {stats.personalAlerts.map((alert, i) => (
                                        <div key={i} className="p-4 bg-destructive/5 border border-destructive/10 rounded-xl flex items-center gap-3 animate-in fade-in duration-500">
                                            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                                                <Info size={16} />
                                            </div>
                                            <span className="text-xs font-semibold uppercase tracking-tight text-destructive">{alert}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* My Activities (Activity Logs) */}
                                <Card className="rounded-xl border-border shadow-sm">
                                    <CardHeader className="p-6 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold">Assigned to Me</CardTitle>
                                            <Button variant="link" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-primary px-0" onClick={() => onNavigate('weekly')}>View All</Button>
                                        </div>
                                    </CardHeader>
                                    <div className="px-0">
                                        <Table>
                                            <TableBody>
                                                {listData.myActivities.map((act) => (
                                                    <TableRow key={act.id} className="border-border/50 hover:bg-muted/30">
                                                        <TableCell className="pl-6 py-3">
                                                            <p className="text-sm font-semibold">{act.activity_name || act.category}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${act.priority === 'High' ? 'text-destructive border-destructive/30' : ''}`}>{act.priority || 'Medium'}</Badge>
                                                                <span className="text-[9px] font-medium text-muted-foreground uppercase">Due: {act.due_date || '-'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right"><StatusBadge status={act.status} /></TableCell>
                                                    </TableRow>
                                                ))}
                                                {listData.myActivities.length === 0 && (
                                                    <TableRow><TableCell colSpan={2} className="h-40 text-center text-muted-foreground uppercase text-[10px] tracking-widest">No activities</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>

                                {/* 4. My Procurement Requests */}
                                <Card className="rounded-xl border-border shadow-sm">
                                    <CardHeader className="p-6 pb-2">
                                        <CardTitle className="text-base font-semibold">Procurement</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Pending', val: stats.procurementStats.pending, color: 'text-amber-500' },
                                                { label: 'Approved', val: stats.procurementStats.approved, color: 'text-emerald-500' },
                                                { label: 'Rejected', val: stats.procurementStats.rejected, color: 'text-destructive' },
                                            ].map((st, i) => (
                                                <div key={i} className="text-center p-3 bg-muted/40 rounded-xl border border-border/50">
                                                    <p className={`text-xl font-bold ${st.color}`}>{st.val}</p>
                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{st.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-5 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/10 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
                                            <p className="text-[10px] uppercase font-semibold tracking-wider opacity-90">Estimated Budget</p>
                                            <h3 className="text-2xl font-bold tracking-tight mt-0.5">{formatCurrency(stats.procurementStats.totalBudget)}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* 5. My Borrowed Assets */}
                        <Card className="lg:col-span-12 rounded-xl border-border shadow-sm overflow-hidden bg-card">
                            <CardHeader className="px-6 py-4 border-b border-border/50 flex flex-row items-center justify-between bg-muted/20">
                                <div>
                                    <CardTitle className="text-lg font-bold">Personal Inventory</CardTitle>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">Equipment in your possession</p>
                                </div>
                                <Box className="text-primary/30" size={24} />
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-border/50">
                                            <TableHead className="pl-6 h-10 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Asset Name</TableHead>
                                            <TableHead className="h-10 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Serial / ID</TableHead>
                                            <TableHead className="h-10 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                                            <TableHead className="text-right pr-6 h-10 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {listData.myBorrowedAssets.map((asset) => {
                                            const assetDueDate = asset.due_date ? new Date(asset.due_date) : null;
                                            const isNearDue = assetDueDate && (assetDueDate.getTime() - new Date().getTime()) < 3 * 24 * 3600 * 1000;
                                            return (
                                                <TableRow key={asset.id} className={`border-border/20 hover:bg-muted/30 transition-colors group ${isNearDue ? 'bg-destructive/5' : ''}`}>
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                                                <Database size={14} />
                                                            </div>
                                                            <span className="text-sm font-semibold">{asset.item_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs text-muted-foreground">{asset.serial_number || '-'}</TableCell>
                                                    <TableCell className={`text-xs font-bold ${isNearDue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        {asset.due_date ? new Date(asset.due_date).toLocaleDateString() : '-'}
                                                        {isNearDue && <span className="ml-2 inline-block px-1.5 py-0.5 bg-destructive text-white rounded text-[7px] font-bold uppercase tracking-tight">Express</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6"><StatusBadge status={asset.status} /></TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {listData.myBorrowedAssets.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-widest">You have no active asset loans</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                /* 🏢 CONTROL TOWER (ORGANIZATION) */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">

                    {/* 6. Critical Alerts Panel */}
                    {stats.orgCritical.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                                    <Shield size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-tight leading-none text-destructive">Alert Tower</h3>
                                    <p className="text-xs font-medium mt-1.5 text-destructive/80">Security protocols detected {stats.orgCritical.length} critical items.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {stats.orgCritical.map((alert, i) => (
                                    <div key={i} className="px-3 py-1.5 rounded-lg bg-destructive/20 border border-destructive/30 font-bold text-[9px] uppercase tracking-wider text-destructive">
                                        {alert}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 1. Summary Cards (Global KPI) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <StatCard label="Total Open Tickets" value={stats.totalOpenTickets} icon={MessageSquare} color="blue" subValue="Across teams" />
                        <StatCard label="Active Activities" value={stats.totalActiveActivities} icon={Activity} color="indigo" subValue="In progress" />
                        <StatCard label="Pending Procurement" value={stats.pendingProcurement} icon={ShoppingCart} color="amber" subValue="To review" />
                        <StatCard label="Purchase This Month" value={formatCurrency(stats.totalPurchaseThisMonth)} icon={TrendingUp} color="emerald" subValue="Budget usage" />
                        <StatCard label="Total IT Assets" value={stats.totalITAssets} icon={Database} color="purple" subValue="Inventory count" />
                        <StatCard label="Active Asset Loans" value={stats.activeAssetLoans} icon={Box} color="sky" subValue="Out on loan" />
                        <StatCard label="Completion Rate" value={stats.taskCompletionRate} icon={Zap} color="orange" subValue="Efficiency" />
                    </div>

                    {/* Purchase Record Summary */}
                    <Card className="rounded-xl border-border shadow-sm overflow-hidden bg-card">
                        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Wallet size={18} />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">Purchase Record</CardTitle>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Procurement & Financial Summary</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 h-8" onClick={() => onNavigate('purchase-record')}>
                                View All <ChevronRight size={12} className="ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-5">
                            {/* Financial KPIs Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Disbursed</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(stats.purchaseSummary.totalDisbursed)}</p>
                                    <p className="text-[8px] font-medium text-muted-foreground/60 uppercase mt-0.5">Verified & Settled</p>
                                </div>
                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Liability</p>
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">{formatCurrency(stats.purchaseSummary.totalLiability)}</p>
                                    <p className="text-[8px] font-medium text-muted-foreground/60 uppercase mt-0.5">{stats.purchaseSummary.pendingCount} Pending</p>
                                </div>
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fiscal Volume</p>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(stats.purchaseSummary.fiscalVolume)}</p>
                                    <p className="text-[8px] font-medium text-muted-foreground/60 uppercase mt-0.5">Gross Total</p>
                                </div>
                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Records</p>
                                    <p className="text-lg font-bold text-primary tracking-tight">{stats.purchaseSummary.totalRecords}</p>
                                    <p className="text-[8px] font-medium text-muted-foreground/60 uppercase mt-0.5">Transactions</p>
                                </div>
                            </div>

                            {/* Breakdown Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Top Categories */}
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Tag size={13} className="text-indigo-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cost Breakdown</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {stats.purchaseSummary.topCategories.length === 0 ? (
                                            <p className="text-[10px] text-muted-foreground/50 font-medium text-center py-4">No data</p>
                                        ) : stats.purchaseSummary.topCategories.map((cat, idx) => (
                                            <div key={cat.name} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? 'bg-indigo-500' : 'bg-muted-foreground/30'}`} />
                                                    <span className="text-[10px] font-semibold text-muted-foreground truncate uppercase">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-bold text-foreground">{formatCurrency(cat.total)}</span>
                                                    <span className="text-[9px] font-bold text-indigo-500 w-7 text-right">{cat.percentage}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Departments */}
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Briefcase size={13} className="text-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department Spend</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {stats.purchaseSummary.topDepartments.length === 0 ? (
                                            <p className="text-[10px] text-muted-foreground/50 font-medium text-center py-4">No data</p>
                                        ) : stats.purchaseSummary.topDepartments.map((dept, idx) => (
                                            <div key={dept.name} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                                    <span className="text-[10px] font-semibold text-muted-foreground truncate uppercase">{dept.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-bold text-foreground">{formatCurrency(dept.total)}</span>
                                                    <span className="text-[9px] font-bold text-emerald-500 w-7 text-right">{dept.percentage}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* 2. Ticket Overview (Chart) */}
                        <Card className="lg:col-span-8 rounded-xl border-border shadow-sm overflow-hidden bg-card">
                            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Feed</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold uppercase tracking-tight">Support Dynamics</CardTitle>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-80">Ticket resolution velocity</p>
                                </div>
                                <Select defaultValue="last7days">
                                    <SelectTrigger className="w-[160px] rounded-lg bg-muted/40 border-border/50 font-bold uppercase text-[10px] tracking-wider h-10">
                                        <SelectValue placeholder="Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                                        <SelectItem value="monthly">This Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent className="p-8 h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&_line]:stroke-border" stroke="currentColor" strokeOpacity={0.1} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                                        <ReTooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontWeight: 600, fontSize: '11px', padding: '12px', color: 'hsl(var(--foreground))' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOpen)" name="New Tickets" />
                                        <Area type="monotone" dataKey="value2" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 3. Activity Performance & 5. Asset Overview */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Activity Heatmap (GitHub-style) */}
                            <Card className="rounded-xl border-border shadow-sm bg-card">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Activity size={14} className="text-emerald-500" />
                                        Activity Map
                                    </CardTitle>
                                    <p className="text-[10px] font-medium text-muted-foreground">
                                        {stats.activityTotal} contributions across platform
                                    </p>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <div className="overflow-x-auto no-scrollbar">
                                        <div className="flex gap-[3px] min-w-0">
                                            {(() => {
                                                const weeks: { date: Date; count: number }[][] = [];
                                                const today = new Date();
                                                const totalWeeks = 20;
                                                // Build grid: each column = 1 week (7 days)
                                                for (let w = totalWeeks - 1; w >= 0; w--) {
                                                    const week: { date: Date; count: number }[] = [];
                                                    for (let d = 0; d < 7; d++) {
                                                        const date = new Date(today);
                                                        date.setDate(today.getDate() - (w * 7 + (6 - d)));
                                                        const key = date.toISOString().split('T')[0];
                                                        week.push({ date, count: stats.activityHeatmap[key] || 0 });
                                                    }
                                                    weeks.push(week);
                                                }

                                                // Find max for color scaling
                                                const maxCount = Math.max(1, ...Object.values(stats.activityHeatmap));

                                                const getColor = (count: number) => {
                                                    if (count === 0) return 'bg-muted dark:bg-slate-800';
                                                    const ratio = count / maxCount;
                                                    if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/60';
                                                    if (ratio <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700';
                                                    if (ratio <= 0.75) return 'bg-emerald-500 dark:bg-emerald-500';
                                                    return 'bg-emerald-600 dark:bg-emerald-400';
                                                };

                                                // Month labels
                                                const monthLabels: { label: string; col: number }[] = [];
                                                let lastMonth = -1;
                                                weeks.forEach((week, colIdx) => {
                                                    const firstDay = week[0];
                                                    if (firstDay && firstDay.date.getMonth() !== lastMonth) {
                                                        lastMonth = firstDay.date.getMonth();
                                                        monthLabels.push({
                                                            label: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
                                                            col: colIdx
                                                        });
                                                    }
                                                });

                                                return (
                                                    <div className="flex flex-col gap-0">
                                                        {/* Month labels */}
                                                        <div className="flex gap-[4px] mb-2 ml-[32px]">
                                                            {weeks.map((_, colIdx) => {
                                                                const label = monthLabels.find(m => m.col === colIdx);
                                                                return (
                                                                    <div key={colIdx} className="w-[15px] shrink-0">
                                                                        {label && <span className="text-[9px] font-bold text-muted-foreground/80">{label.label}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {/* Grid rows */}
                                                        {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                                            <div key={dayIdx} className="flex items-center gap-[4px]">
                                                                <span className="w-[28px] text-[9px] font-bold text-muted-foreground/60 text-right shrink-0">
                                                                    {dayIdx === 1 ? 'Mon' : dayIdx === 3 ? 'Wed' : dayIdx === 5 ? 'Fri' : ''}
                                                                </span>
                                                                {weeks.map((week, colIdx) => {
                                                                    const cell = week[dayIdx];
                                                                    if (!cell) return <div key={colIdx} className="w-[15px] h-[15px]" />;
                                                                    return (
                                                                        <div
                                                                            key={colIdx}
                                                                            className={`w-[15px] h-[15px] rounded-[3px] ${getColor(cell.count)} border border-white/5 dark:border-black/10 transition-all hover:scale-110`}
                                                                            title={`${cell.date.toLocaleDateString()}: ${cell.count} activities`}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex items-center justify-end gap-1.5 mt-3">
                                        <span className="text-[8px] font-medium text-muted-foreground/50">Less</span>
                                        <div className="w-[10px] h-[10px] rounded-[2px] bg-muted dark:bg-slate-800" />
                                        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900/60" />
                                        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
                                        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
                                        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-400" />
                                        <span className="text-[8px] font-medium text-muted-foreground/50">More</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 5. Asset Overview */}
                            <Card className="rounded-xl border-border shadow-sm overflow-hidden bg-card">
                                <CardHeader className="p-6 pb-2">
                                    <CardTitle className="text-base font-semibold">Inventory</CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 flex flex-col items-center">
                                    <div className="w-full h-44 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(stats.assetBreakdown.categories).map(([name, value], idx) => ({
                                                        name,
                                                        value,
                                                        color: [
                                                            'hsl(var(--primary))',
                                                            '#10b981',
                                                            '#3b82f6',
                                                            '#f59e0b',
                                                            '#8b5cf6',
                                                            '#ec4899',
                                                            '#06b6d4'
                                                        ][idx % 7]
                                                    }))}
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {Object.entries(stats.assetBreakdown.categories).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={[
                                                            'hsl(var(--primary))',
                                                            '#10b981',
                                                            '#3b82f6',
                                                            '#f59e0b',
                                                            '#8b5cf6',
                                                            '#ec4899',
                                                            '#06b6d4'
                                                        ][index % 7]} />
                                                    ))}
                                                </Pie>
                                                <ReTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xl font-bold tracking-tight">{stats.totalITAssets}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Total</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4">
                                        {Object.entries(stats.assetBreakdown.categories).map(([name, value], idx) => (
                                            <div key={name} className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{
                                                        backgroundColor: [
                                                            'hsl(var(--primary))',
                                                            '#10b981',
                                                            '#3b82f6',
                                                            '#f59e0b',
                                                            '#8b5cf6',
                                                            '#ec4899',
                                                            '#06b6d4'
                                                        ][idx % 7]
                                                    }} />
                                                    <p className="text-sm font-bold">{value as number}</p>
                                                </div>
                                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 4. Procurement Overview Table */}
                        <Card className="lg:col-span-12 rounded-xl border-border shadow-sm overflow-hidden bg-card">
                            <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                                <div>
                                    <CardTitle className="text-lg font-bold">Project Initiatives</CardTitle>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">Tracking departmental progress</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative group hidden md:block">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={projectSearch}
                                            onChange={(e) => setProjectSearch(e.target.value)}
                                            className="h-8 w-40 bg-background border border-border rounded-lg pl-8 pr-3 text-[11px] focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={fetchData}>
                                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-border/50">
                                            <TableHead className="pl-6 h-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Project Name</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Owner</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Progress</TableHead>
                                            <TableHead className="text-right pr-6 h-12 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedProjects.map((project) => (
                                            <TableRow key={project.id} className="border-border/20 hover:bg-muted/30 transition-all group">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">{project.name.charAt(0)}</div>
                                                        <span className="text-sm font-semibold tracking-tight">{project.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell><UserAvatar name={project.owner} size="sm" /></TableCell>
                                                <TableCell><StatusBadge status={project.status} /></TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[120px]">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${project.progress}%` }}
                                                                transition={{ duration: 1, delay: 0.2 }}
                                                                className="h-full bg-primary"
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-bold tabular-nums">{project.progress}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">{new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/20">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Showing {paginatedProjects.length} of {filteredProjects.length} results</p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg font-bold text-xs" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Prev</Button>
                                    <div className="px-3 text-xs font-bold uppercase text-muted-foreground">Page {currentPage} of {totalPages}</div>
                                    <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg font-bold text-xs" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
